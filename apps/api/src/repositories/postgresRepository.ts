import { Pool } from "pg";
import { CURRENT_TERMS, HYDERABAD_SCHOOLS } from "../constants.js";
import { Stage1Repository } from "../repository.js";
import {
  CreateNotificationInput,
  CreateUserInput,
  InAppNotification,
  OnboardingUpdate,
  OtpRequest,
  School,
  Session,
  TermsInfo,
  ThemePreference,
  User,
} from "../types.js";

type UserQueryRow = {
  id: string;
  phone: string;
  name: string;
  dob: string | null;
  profile_photo: string;
  neighbourhood: string;
  terms_version: string | null;
  terms_accepted_at: string | null;
  theme_preference: ThemePreference;
  created_at: string;
  onboarding_completed_at: string | null;
  school_id: string | null;
  school_name: string | null;
  school_area: string | null;
  school_city: string | null;
  interests: string[];
};

const USER_SELECT_SQL = `
  SELECT
    u.id,
    u.phone,
    u.name,
    u.dob::text AS dob,
    u.profile_photo,
    u.neighbourhood,
    u.terms_version,
    u.terms_accepted_at::text AS terms_accepted_at,
    u.theme_preference,
    u.created_at::text AS created_at,
    u.onboarding_completed_at::text AS onboarding_completed_at,
    s.id AS school_id,
    s.name AS school_name,
    s.area AS school_area,
    s.city AS school_city,
    COALESCE(array_remove(array_agg(DISTINCT ui.interest), NULL), '{}') AS interests
  FROM users u
  LEFT JOIN schools s ON s.id = u.school_id
  LEFT JOIN user_interests ui ON ui.user_id = u.id
`;

function mapUser(row: UserQueryRow): User {
  return {
    id: row.id,
    phone: row.phone,
    name: row.name,
    dob: row.dob,
    profilePhoto: row.profile_photo,
    interests: row.interests ?? [],
    neighbourhood: row.neighbourhood,
    school:
      row.school_id && row.school_name && row.school_area && row.school_city
        ? {
            id: row.school_id,
            name: row.school_name,
            area: row.school_area,
            city: row.school_city,
          }
        : null,
    termsAcceptance:
      row.terms_version && row.terms_accepted_at
        ? {
            version: row.terms_version,
            acceptedAt: row.terms_accepted_at,
          }
        : null,
    themePreference: row.theme_preference,
    createdAt: row.created_at,
    onboardingCompletedAt: row.onboarding_completed_at,
  };
}

export class PostgresStage1Repository implements Stage1Repository {
  private pool: Pool;

  constructor(databaseUrl: string, sslEnabled: boolean) {
    this.pool = new Pool({
      connectionString: databaseUrl,
      ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
    });
  }

  async initialize() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS schools (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        area TEXT NOT NULL,
        city TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        phone TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL DEFAULT '',
        dob DATE NULL,
        profile_photo TEXT NOT NULL DEFAULT '',
        neighbourhood TEXT NOT NULL DEFAULT '',
        school_id TEXT NULL REFERENCES schools(id),
        terms_version TEXT NULL,
        terms_accepted_at TIMESTAMPTZ NULL,
        theme_preference TEXT NOT NULL DEFAULT 'system',
        created_at TIMESTAMPTZ NOT NULL,
        onboarding_completed_at TIMESTAMPTZ NULL
      );

      CREATE TABLE IF NOT EXISTS user_interests (
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        interest TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, interest)
      );

      CREATE TABLE IF NOT EXISTS otp_requests (
        token TEXT PRIMARY KEY,
        phone TEXT NOT NULL,
        code TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        category TEXT NOT NULL,
        read_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_notifications_user_created
      ON notifications(user_id, created_at DESC);
    `);

    for (const school of HYDERABAD_SCHOOLS) {
      await this.pool.query(
        `
          INSERT INTO schools (id, name, area, city)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id) DO UPDATE
          SET name = EXCLUDED.name,
              area = EXCLUDED.area,
              city = EXCLUDED.city
        `,
        [school.id, school.name, school.area, school.city],
      );
    }

    await this.pool.query(`
      DELETE FROM otp_requests
      WHERE expires_at < NOW()
    `);
  }

  async close() {
    await this.pool.end();
  }

  async getTermsInfo(): Promise<TermsInfo> {
    return CURRENT_TERMS;
  }

  async listSchools(query: string, limit: number): Promise<School[]> {
    const normalized = `%${query.trim().toLowerCase()}%`;
    const results = await this.pool.query<School>(
      `
        SELECT id, name, area, city
        FROM schools
        WHERE ($1 = '%%') OR (LOWER(name) LIKE $1 OR LOWER(area) LIKE $1)
        ORDER BY name ASC
        LIMIT $2
      `,
      [normalized, limit],
    );

    return results.rows;
  }

  async findSchoolById(id: string): Promise<School | null> {
    const result = await this.pool.query<School>(
      `
        SELECT id, name, area, city
        FROM schools
        WHERE id = $1
        LIMIT 1
      `,
      [id],
    );

    return result.rows[0] ?? null;
  }

  async createOtpRequest(request: OtpRequest) {
    await this.pool.query(
      `
        INSERT INTO otp_requests (token, phone, code, created_at, expires_at)
        VALUES ($1, $2, $3, $4, $5)
      `,
      [request.token, request.phone, request.code, request.createdAt, request.expiresAt],
    );
  }

  async getOtpRequest(token: string): Promise<OtpRequest | null> {
    const result = await this.pool.query<{
      token: string;
      phone: string;
      code: string;
      created_at: string;
      expires_at: string;
    }>(
      `
        SELECT token, phone, code, created_at::text AS created_at, expires_at::text AS expires_at
        FROM otp_requests
        WHERE token = $1
      `,
      [token],
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return {
      token: row.token,
      phone: row.phone,
      code: row.code,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    };
  }

  async consumeOtpRequest(token: string) {
    await this.pool.query("DELETE FROM otp_requests WHERE token = $1", [token]);
  }

  async createSession(session: Session) {
    await this.pool.query(
      `
        INSERT INTO sessions (token, user_id, created_at)
        VALUES ($1, $2, $3)
      `,
      [session.token, session.userId, session.createdAt],
    );
  }

  async findUserBySessionToken(token: string): Promise<User | null> {
    const result = await this.pool.query<UserQueryRow>(
      `
        ${USER_SELECT_SQL}
        JOIN sessions sess ON sess.user_id = u.id
        WHERE sess.token = $1
        GROUP BY u.id, s.id
      `,
      [token],
    );

    const row = result.rows[0];
    return row ? mapUser(row) : null;
  }

  async findUserByPhone(phone: string): Promise<User | null> {
    const result = await this.pool.query<UserQueryRow>(
      `
        ${USER_SELECT_SQL}
        WHERE u.phone = $1
        GROUP BY u.id, s.id
      `,
      [phone],
    );

    const row = result.rows[0];
    return row ? mapUser(row) : null;
  }

  async createUser(input: CreateUserInput): Promise<User> {
    await this.pool.query(
      `
        INSERT INTO users (id, phone, created_at)
        VALUES ($1, $2, $3)
      `,
      [input.id, input.phone, input.createdAt],
    );

    const user = await this.findUserById(input.id);
    if (!user) {
      throw new Error("Failed to create user");
    }

    return user;
  }

  async findUserById(id: string): Promise<User | null> {
    const result = await this.pool.query<UserQueryRow>(
      `
        ${USER_SELECT_SQL}
        WHERE u.id = $1
        GROUP BY u.id, s.id
      `,
      [id],
    );

    const row = result.rows[0];
    return row ? mapUser(row) : null;
  }

  async updateOnboarding(userId: string, update: OnboardingUpdate): Promise<User> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `
          UPDATE users
          SET
            name = $2,
            dob = $3,
            profile_photo = $4,
            neighbourhood = $5,
            school_id = $6,
            terms_version = $7,
            terms_accepted_at = $8,
            theme_preference = $9,
            onboarding_completed_at = COALESCE(onboarding_completed_at, $8)
          WHERE id = $1
        `,
        [
          userId,
          update.name,
          update.dob,
          update.profilePhoto,
          update.neighbourhood,
          update.schoolId,
          update.termsVersion,
          update.completedAt,
          update.themePreference,
        ],
      );

      await client.query("DELETE FROM user_interests WHERE user_id = $1", [userId]);

      for (const interest of update.interests) {
        await client.query(
          `
            INSERT INTO user_interests (user_id, interest)
            VALUES ($1, $2)
            ON CONFLICT (user_id, interest) DO NOTHING
          `,
          [userId, interest],
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    const user = await this.findUserById(userId);
    if (!user) {
      throw new Error("User not found after onboarding update");
    }

    return user;
  }

  async updateTheme(userId: string, themePreference: ThemePreference): Promise<ThemePreference> {
    await this.pool.query(
      `
        UPDATE users
        SET theme_preference = $2
        WHERE id = $1
      `,
      [userId, themePreference],
    );

    return themePreference;
  }

  async createNotification(input: CreateNotificationInput) {
    await this.pool.query(
      `
        INSERT INTO notifications (id, user_id, title, body, category, read_at, created_at)
        VALUES ($1, $2, $3, $4, $5, NULL, $6)
      `,
      [input.id, input.userId, input.title, input.body, input.category, input.createdAt],
    );
  }

  async listNotifications(userId: string): Promise<InAppNotification[]> {
    const result = await this.pool.query<{
      id: string;
      user_id: string;
      title: string;
      body: string;
      category: "system" | "onboarding";
      read_at: string | null;
      created_at: string;
    }>(
      `
        SELECT id, user_id, title, body, category, read_at::text AS read_at, created_at::text AS created_at
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
      `,
      [userId],
    );

    return result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      body: row.body,
      category: row.category,
      readAt: row.read_at,
      createdAt: row.created_at,
    }));
  }

  async markAllNotificationsRead(userId: string, readAt: string): Promise<void> {
    await this.pool.query(
      `
        UPDATE notifications
        SET read_at = $2
        WHERE user_id = $1 AND read_at IS NULL
      `,
      [userId, readAt],
    );
  }

  async markNotificationRead(userId: string, notificationId: string, readAt: string): Promise<InAppNotification | null> {
    const result = await this.pool.query<{
      id: string;
      user_id: string;
      title: string;
      body: string;
      category: "system" | "onboarding";
      read_at: string | null;
      created_at: string;
    }>(
      `
        UPDATE notifications
        SET read_at = COALESCE(read_at, $3)
        WHERE id = $1 AND user_id = $2
        RETURNING id, user_id, title, body, category, read_at::text AS read_at, created_at::text AS created_at
      `,
      [notificationId, userId, readAt],
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      body: row.body,
      category: row.category,
      readAt: row.read_at,
      createdAt: row.created_at,
    };
  }
}
