import { Pool, PoolClient } from "pg";
import {
  CURRENT_TERMS,
  HYDERABAD_SCHOOLS,
  RAZORPAY_KEY_ID,
  STAGE2_EVENTS,
  STAGE2_EVENT_UPDATES,
  STAGE2_ORGANISERS,
} from "../constants.js";
import { Stage1Repository } from "../repository.js";
import {
  CreateNotificationInput,
  CreateUserInput,
  EventApplication,
  EventApplicationDetails,
  EventFilters,
  EventPaymentIntent,
  EventRecord,
  EventTicket,
  EventUpdate,
  FriendRequest,
  FriendRequestStatus,
  FriendsGoingSignal,
  InAppNotification,
  NotificationCategory,
  OnboardingUpdate,
  Organiser,
  OrganiserIntakeSubmission,
  OtpRequest,
  School,
  Session,
  TermsInfo,
  ThemePreference,
  User,
  UserDiscoveryResult,
} from "../types.js";
import {
  createEventApplicationId,
  createFriendRequestId,
  createRazorpayOrderId,
  createTicketId,
} from "../utils.js";

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

type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  read_at: string | null;
  created_at: string;
};

type EventRow = {
  id: string;
  organiser_id: string;
  title: string;
  description: string;
  category: EventRecord["category"];
  area: string;
  venue: string;
  starts_at: string;
  ends_at: string;
  price_cents: number;
  currency: "INR";
  max_attendees: number;
  application_closed: boolean;
  created_at: string;
};

type EventUpdateRow = {
  id: string;
  event_id: string;
  title: string;
  body: string;
  created_at: string;
};

type OrganiserRow = {
  id: string;
  name: string;
  tagline: string;
  verified: boolean;
};

type EventApplicationRow = {
  id: string;
  event_id: string;
  user_id: string;
  status: EventApplication["status"];
  details_json: EventApplicationDetails | null;
  payment_order_id: string | null;
  payment_id: string | null;
  ticket_id: string | null;
  created_at: string;
  updated_at: string;
};

type TicketRow = {
  id: string;
  application_id: string;
  event_id: string;
  user_id: string;
  qr_payload: string;
  issued_at: string;
};

type FriendRequestRow = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: FriendRequestStatus;
  created_at: string;
  responded_at: string | null;
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

function mapNotification(row: NotificationRow): InAppNotification {
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

function mapEvent(row: EventRow): EventRecord {
  return {
    id: row.id,
    organiserId: row.organiser_id,
    title: row.title,
    description: row.description,
    category: row.category,
    area: row.area,
    venue: row.venue,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    priceCents: row.price_cents,
    currency: row.currency,
    maxAttendees: row.max_attendees,
    applicationClosed: row.application_closed,
    createdAt: row.created_at,
  };
}

function mapEventUpdate(row: EventUpdateRow): EventUpdate {
  return {
    id: row.id,
    eventId: row.event_id,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
  };
}

function mapOrganiser(row: OrganiserRow): Organiser {
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline,
    verified: row.verified,
  };
}

function mapApplication(row: EventApplicationRow): EventApplication {
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    status: row.status,
    details: row.details_json,
    paymentOrderId: row.payment_order_id,
    paymentId: row.payment_id,
    ticketId: row.ticket_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTicket(row: TicketRow): EventTicket {
  return {
    id: row.id,
    applicationId: row.application_id,
    eventId: row.event_id,
    userId: row.user_id,
    qrPayload: row.qr_payload,
    issuedAt: row.issued_at,
  };
}

function mapFriendRequest(row: FriendRequestRow): FriendRequest {
  return {
    id: row.id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    status: row.status,
    createdAt: row.created_at,
    respondedAt: row.responded_at,
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

      CREATE TABLE IF NOT EXISTS organisers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        tagline TEXT NOT NULL,
        verified BOOLEAN NOT NULL DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        organiser_id TEXT NOT NULL REFERENCES organisers(id),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        area TEXT NOT NULL,
        venue TEXT NOT NULL,
        starts_at TIMESTAMPTZ NOT NULL,
        ends_at TIMESTAMPTZ NOT NULL,
        price_cents INTEGER NOT NULL,
        currency TEXT NOT NULL,
        max_attendees INTEGER NOT NULL,
        application_closed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS event_updates (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS event_applications (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL,
        details_json JSONB NULL,
        payment_order_id TEXT NULL,
        payment_id TEXT NULL,
        ticket_id TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS event_tickets (
        id TEXT PRIMARY KEY,
        application_id TEXT NOT NULL UNIQUE REFERENCES event_applications(id) ON DELETE CASCADE,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        qr_payload TEXT NOT NULL,
        issued_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS friend_requests (
        id TEXT PRIMARY KEY,
        from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        to_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        responded_at TIMESTAMPTZ NULL
      );

      CREATE TABLE IF NOT EXISTS organiser_intake_submissions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        organisation_name TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_events_filters ON events(category, area, starts_at);
      CREATE INDEX IF NOT EXISTS idx_event_updates_event_created ON event_updates(event_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_event_applications_user_event ON event_applications(user_id, event_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_friend_requests_pair ON friend_requests(from_user_id, to_user_id);
    `);

    for (const school of HYDERABAD_SCHOOLS) {
      await this.pool.query(
        `
          INSERT INTO schools (id, name, area, city)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id) DO UPDATE
          SET name = EXCLUDED.name, area = EXCLUDED.area, city = EXCLUDED.city
        `,
        [school.id, school.name, school.area, school.city],
      );
    }

    for (const organiser of STAGE2_ORGANISERS) {
      await this.pool.query(
        `
          INSERT INTO organisers (id, name, tagline, verified)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id) DO UPDATE
          SET name = EXCLUDED.name, tagline = EXCLUDED.tagline, verified = EXCLUDED.verified
        `,
        [organiser.id, organiser.name, organiser.tagline, organiser.verified],
      );
    }

    for (const event of STAGE2_EVENTS) {
      await this.pool.query(
        `
          INSERT INTO events (
            id, organiser_id, title, description, category, area, venue,
            starts_at, ends_at, price_cents, currency, max_attendees, application_closed, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (id) DO UPDATE
          SET organiser_id = EXCLUDED.organiser_id,
              title = EXCLUDED.title,
              description = EXCLUDED.description,
              category = EXCLUDED.category,
              area = EXCLUDED.area,
              venue = EXCLUDED.venue,
              starts_at = EXCLUDED.starts_at,
              ends_at = EXCLUDED.ends_at,
              price_cents = EXCLUDED.price_cents,
              currency = EXCLUDED.currency,
              max_attendees = EXCLUDED.max_attendees,
              application_closed = EXCLUDED.application_closed,
              created_at = EXCLUDED.created_at
        `,
        [
          event.id,
          event.organiserId,
          event.title,
          event.description,
          event.category,
          event.area,
          event.venue,
          event.startsAt,
          event.endsAt,
          event.priceCents,
          event.currency,
          event.maxAttendees,
          event.applicationClosed,
          event.createdAt,
        ],
      );
    }

    for (const update of STAGE2_EVENT_UPDATES) {
      await this.pool.query(
        `
          INSERT INTO event_updates (id, event_id, title, body, created_at)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO UPDATE
          SET event_id = EXCLUDED.event_id, title = EXCLUDED.title, body = EXCLUDED.body, created_at = EXCLUDED.created_at
        `,
        [update.id, update.eventId, update.title, update.body, update.createdAt],
      );
    }

    await this.pool.query(`DELETE FROM otp_requests WHERE expires_at < NOW()`);
  }

  async close() {
    await this.pool.end();
  }

  async getTermsInfo(): Promise<TermsInfo> {
    return CURRENT_TERMS;
  }

  async listSchools(query: string, limit: number): Promise<School[]> {
    const normalized = `%${query.trim().toLowerCase()}%`;
    const result = await this.pool.query<School>(
      `
        SELECT id, name, area, city
        FROM schools
        WHERE ($1 = '%%') OR (LOWER(name) LIKE $1 OR LOWER(area) LIKE $1)
        ORDER BY name ASC
        LIMIT $2
      `,
      [normalized, limit],
    );
    return result.rows;
  }

  async findSchoolById(id: string): Promise<School | null> {
    const result = await this.pool.query<School>(
      `SELECT id, name, area, city FROM schools WHERE id = $1 LIMIT 1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async createOtpRequest(request: OtpRequest): Promise<void> {
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
    return row
      ? {
          token: row.token,
          phone: row.phone,
          code: row.code,
          createdAt: row.created_at,
          expiresAt: row.expires_at,
        }
      : null;
  }

  async consumeOtpRequest(token: string): Promise<void> {
    await this.pool.query(`DELETE FROM otp_requests WHERE token = $1`, [token]);
  }

  async createSession(session: Session): Promise<void> {
    await this.pool.query(
      `INSERT INTO sessions (token, user_id, created_at) VALUES ($1, $2, $3)`,
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
    return result.rows[0] ? mapUser(result.rows[0]) : null;
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
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async createUser(input: CreateUserInput): Promise<User> {
    await this.pool.query(
      `INSERT INTO users (id, phone, created_at) VALUES ($1, $2, $3)`,
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
    return result.rows[0] ? mapUser(result.rows[0]) : null;
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
      await client.query(`DELETE FROM user_interests WHERE user_id = $1`, [userId]);

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
    await this.pool.query(`UPDATE users SET theme_preference = $2 WHERE id = $1`, [userId, themePreference]);
    return themePreference;
  }

  async createNotification(input: CreateNotificationInput): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO notifications (id, user_id, title, body, category, read_at, created_at)
        VALUES ($1, $2, $3, $4, $5, NULL, $6)
      `,
      [input.id, input.userId, input.title, input.body, input.category, input.createdAt],
    );
  }

  async listNotifications(userId: string): Promise<InAppNotification[]> {
    const result = await this.pool.query<NotificationRow>(
      `
        SELECT id, user_id, title, body, category, read_at::text AS read_at, created_at::text AS created_at
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
      `,
      [userId],
    );
    return result.rows.map(mapNotification);
  }

  async markAllNotificationsRead(userId: string, readAt: string): Promise<void> {
    await this.pool.query(
      `UPDATE notifications SET read_at = $2 WHERE user_id = $1 AND read_at IS NULL`,
      [userId, readAt],
    );
  }

  async markNotificationRead(userId: string, notificationId: string, readAt: string): Promise<InAppNotification | null> {
    const result = await this.pool.query<NotificationRow>(
      `
        UPDATE notifications
        SET read_at = COALESCE(read_at, $3)
        WHERE id = $1 AND user_id = $2
        RETURNING id, user_id, title, body, category, read_at::text AS read_at, created_at::text AS created_at
      `,
      [notificationId, userId, readAt],
    );
    return result.rows[0] ? mapNotification(result.rows[0]) : null;
  }

  async listEvents(filters: EventFilters): Promise<EventRecord[]> {
    const values: Array<string | number> = [];
    const where: string[] = [];

    if (filters.category) {
      values.push(filters.category);
      where.push(`category = $${values.length}`);
    }
    if (filters.area?.trim()) {
      values.push(`%${filters.area.trim().toLowerCase()}%`);
      where.push(`LOWER(area) LIKE $${values.length}`);
    }
    if (filters.date) {
      values.push(filters.date);
      where.push(`starts_at::date = $${values.length}::date`);
    }
    if (filters.price === "free") {
      where.push(`price_cents = 0`);
    }
    if (filters.price === "paid") {
      where.push(`price_cents > 0`);
    }

    values.push(filters.limit);
    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const result = await this.pool.query<EventRow>(
      `
        SELECT
          id,
          organiser_id,
          title,
          description,
          category,
          area,
          venue,
          starts_at::text AS starts_at,
          ends_at::text AS ends_at,
          price_cents,
          currency,
          max_attendees,
          application_closed,
          created_at::text AS created_at
        FROM events
        ${whereClause}
        ORDER BY starts_at ASC
        LIMIT $${values.length}
      `,
      values,
    );
    return result.rows.map(mapEvent);
  }

  async findEventById(eventId: string): Promise<EventRecord | null> {
    const result = await this.pool.query<EventRow>(
      `
        SELECT
          id,
          organiser_id,
          title,
          description,
          category,
          area,
          venue,
          starts_at::text AS starts_at,
          ends_at::text AS ends_at,
          price_cents,
          currency,
          max_attendees,
          application_closed,
          created_at::text AS created_at
        FROM events
        WHERE id = $1
        LIMIT 1
      `,
      [eventId],
    );
    return result.rows[0] ? mapEvent(result.rows[0]) : null;
  }

  async findOrganiserById(organiserId: string): Promise<Organiser | null> {
    const result = await this.pool.query<OrganiserRow>(
      `SELECT id, name, tagline, verified FROM organisers WHERE id = $1 LIMIT 1`,
      [organiserId],
    );
    return result.rows[0] ? mapOrganiser(result.rows[0]) : null;
  }

  async listEventUpdates(eventId: string, limit: number): Promise<EventUpdate[]> {
    const result = await this.pool.query<EventUpdateRow>(
      `
        SELECT id, event_id, title, body, created_at::text AS created_at
        FROM event_updates
        WHERE event_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `,
      [eventId, limit],
    );
    return result.rows.map(mapEventUpdate);
  }

  async createEventApplication(userId: string, eventId: string, createdAt: string): Promise<EventApplication> {
    const id = createEventApplicationId();
    const result = await this.pool.query<EventApplicationRow>(
      `
        INSERT INTO event_applications (
          id, event_id, user_id, status, details_json, payment_order_id, payment_id, ticket_id, created_at, updated_at
        )
        VALUES ($1, $2, $3, 'review', NULL, NULL, NULL, NULL, $4, $4)
        RETURNING
          id,
          event_id,
          user_id,
          status,
          details_json,
          payment_order_id,
          payment_id,
          ticket_id,
          created_at::text AS created_at,
          updated_at::text AS updated_at
      `,
      [id, eventId, userId, createdAt],
    );
    return mapApplication(result.rows[0]);
  }

  async findEventApplicationById(applicationId: string): Promise<EventApplication | null> {
    const result = await this.pool.query<EventApplicationRow>(
      `
        SELECT
          id,
          event_id,
          user_id,
          status,
          details_json,
          payment_order_id,
          payment_id,
          ticket_id,
          created_at::text AS created_at,
          updated_at::text AS updated_at
        FROM event_applications
        WHERE id = $1
        LIMIT 1
      `,
      [applicationId],
    );
    return result.rows[0] ? mapApplication(result.rows[0]) : null;
  }

  async findLatestEventApplication(userId: string, eventId: string): Promise<EventApplication | null> {
    const result = await this.pool.query<EventApplicationRow>(
      `
        SELECT
          id,
          event_id,
          user_id,
          status,
          details_json,
          payment_order_id,
          payment_id,
          ticket_id,
          created_at::text AS created_at,
          updated_at::text AS updated_at
        FROM event_applications
        WHERE user_id = $1 AND event_id = $2
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [userId, eventId],
    );
    return result.rows[0] ? mapApplication(result.rows[0]) : null;
  }

  async updateEventApplicationDetails(
    applicationId: string,
    userId: string,
    details: EventApplicationDetails,
    updatedAt: string,
  ): Promise<EventApplication | null> {
    const result = await this.pool.query<EventApplicationRow>(
      `
        UPDATE event_applications
        SET details_json = $3, status = 'details_completed', updated_at = $4
        WHERE id = $1 AND user_id = $2
        RETURNING
          id,
          event_id,
          user_id,
          status,
          details_json,
          payment_order_id,
          payment_id,
          ticket_id,
          created_at::text AS created_at,
          updated_at::text AS updated_at
      `,
      [applicationId, userId, JSON.stringify(details), updatedAt],
    );
    return result.rows[0] ? mapApplication(result.rows[0]) : null;
  }

  async createEventPaymentIntent(applicationId: string, userId: string, updatedAt: string): Promise<EventPaymentIntent | null> {
    const existing = await this.findEventApplicationById(applicationId);
    if (!existing || existing.userId !== userId) {
      return null;
    }
    const event = await this.findEventById(existing.eventId);
    if (!event) {
      return null;
    }

    const orderId = existing.paymentOrderId ?? createRazorpayOrderId();
    const updated = await this.pool.query<EventApplicationRow>(
      `
        UPDATE event_applications
        SET payment_order_id = $3, status = 'payment_pending', updated_at = $4
        WHERE id = $1 AND user_id = $2
        RETURNING
          id,
          event_id,
          user_id,
          status,
          details_json,
          payment_order_id,
          payment_id,
          ticket_id,
          created_at::text AS created_at,
          updated_at::text AS updated_at
      `,
      [applicationId, userId, orderId, updatedAt],
    );
    if (!updated.rows[0]) {
      return null;
    }

    return {
      provider: "razorpay",
      orderId,
      amountCents: event.priceCents,
      currency: event.currency,
      keyId: RAZORPAY_KEY_ID,
      receipt: `receipt_${applicationId}`,
      notes: {
        eventId: event.id,
        applicationId,
      },
    };
  }

  async confirmEventPayment(
    applicationId: string,
    userId: string,
    paymentId: string,
    confirmedAt: string,
  ): Promise<{ application: EventApplication; ticket: EventTicket; wasAlreadyConfirmed: boolean } | null> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");
      const application = await this.findApplicationForUpdate(client, applicationId, userId);
      if (!application) {
        await client.query("ROLLBACK");
        return null;
      }

      if (application.ticket_id) {
        const existingTicket = await this.findTicketRow(client, application.ticket_id, userId);
        if (!existingTicket) {
          throw new Error("Missing ticket for confirmed application");
        }
        await client.query("COMMIT");
        return {
          application: mapApplication(application),
          ticket: mapTicket(existingTicket),
          wasAlreadyConfirmed: true,
        };
      }

      const ticketId = createTicketId();
      await client.query(
        `
          INSERT INTO event_tickets (id, application_id, event_id, user_id, qr_payload, issued_at)
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [ticketId, application.id, application.event_id, userId, `ts://ticket/${application.event_id}/${application.id}/${userId}`, confirmedAt],
      );

      const updated = await client.query<EventApplicationRow>(
        `
          UPDATE event_applications
          SET payment_id = $3, status = 'confirmed', ticket_id = $4, updated_at = $5
          WHERE id = $1 AND user_id = $2
          RETURNING
            id,
            event_id,
            user_id,
            status,
            details_json,
            payment_order_id,
            payment_id,
            ticket_id,
            created_at::text AS created_at,
            updated_at::text AS updated_at
        `,
        [applicationId, userId, paymentId, ticketId, confirmedAt],
      );
      const ticket = await this.findTicketRow(client, ticketId, userId);
      await client.query("COMMIT");

      return updated.rows[0] && ticket
        ? {
            application: mapApplication(updated.rows[0]),
            ticket: mapTicket(ticket),
            wasAlreadyConfirmed: false,
          }
        : null;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async findTicketById(ticketId: string, userId: string): Promise<EventTicket | null> {
    const row = await this.findTicketRow(this.pool, ticketId, userId);
    return row ? mapTicket(row) : null;
  }

  async searchUsers(query: string, limit: number, viewerId: string): Promise<UserDiscoveryResult[]> {
    const normalized = `%${query.trim().toLowerCase()}%`;
    const result = await this.pool.query<{
      id: string;
      name: string;
      profile_photo: string;
      school_name: string | null;
    }>(
      `
        SELECT u.id, u.name, u.profile_photo, s.name AS school_name
        FROM users u
        LEFT JOIN schools s ON s.id = u.school_id
        WHERE u.id <> $1 AND (($2 = '%%') OR LOWER(u.name) LIKE $2)
        ORDER BY u.name ASC
        LIMIT $3
      `,
      [viewerId, normalized, limit],
    );

    const users: UserDiscoveryResult[] = [];
    for (const row of result.rows) {
      users.push({
        id: row.id,
        name: row.name,
        profilePhoto: row.profile_photo,
        schoolName: row.school_name ?? "",
        friendshipStatus: await this.getFriendshipStatus(viewerId, row.id),
        pendingRequestDirection: await this.findPendingDirection(viewerId, row.id),
      });
    }
    return users;
  }

  async createFriendRequest(fromUserId: string, toUserId: string, createdAt: string): Promise<FriendRequest> {
    const id = createFriendRequestId();
    const result = await this.pool.query<FriendRequestRow>(
      `
        INSERT INTO friend_requests (id, from_user_id, to_user_id, status, created_at, responded_at)
        VALUES ($1, $2, $3, 'pending', $4, NULL)
        RETURNING id, from_user_id, to_user_id, status, created_at::text AS created_at, responded_at::text AS responded_at
      `,
      [id, fromUserId, toUserId, createdAt],
    );
    return mapFriendRequest(result.rows[0]);
  }

  async findFriendRequestBetweenUsers(userA: string, userB: string): Promise<FriendRequest | null> {
    const result = await this.pool.query<FriendRequestRow>(
      `
        SELECT id, from_user_id, to_user_id, status, created_at::text AS created_at, responded_at::text AS responded_at
        FROM friend_requests
        WHERE (from_user_id = $1 AND to_user_id = $2) OR (from_user_id = $2 AND to_user_id = $1)
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [userA, userB],
    );
    return result.rows[0] ? mapFriendRequest(result.rows[0]) : null;
  }

  async findFriendRequestById(requestId: string): Promise<FriendRequest | null> {
    const result = await this.pool.query<FriendRequestRow>(
      `
        SELECT id, from_user_id, to_user_id, status, created_at::text AS created_at, responded_at::text AS responded_at
        FROM friend_requests
        WHERE id = $1
        LIMIT 1
      `,
      [requestId],
    );
    return result.rows[0] ? mapFriendRequest(result.rows[0]) : null;
  }

  async listIncomingFriendRequests(userId: string): Promise<FriendRequest[]> {
    const result = await this.pool.query<FriendRequestRow>(
      `
        SELECT id, from_user_id, to_user_id, status, created_at::text AS created_at, responded_at::text AS responded_at
        FROM friend_requests
        WHERE to_user_id = $1 AND status = 'pending'
        ORDER BY created_at DESC
      `,
      [userId],
    );
    return result.rows.map(mapFriendRequest);
  }

  async listOutgoingFriendRequests(userId: string): Promise<FriendRequest[]> {
    const result = await this.pool.query<FriendRequestRow>(
      `
        SELECT id, from_user_id, to_user_id, status, created_at::text AS created_at, responded_at::text AS responded_at
        FROM friend_requests
        WHERE from_user_id = $1 AND status = 'pending'
        ORDER BY created_at DESC
      `,
      [userId],
    );
    return result.rows.map(mapFriendRequest);
  }

  async updateFriendRequestStatus(
    requestId: string,
    status: FriendRequestStatus,
    respondedAt: string,
  ): Promise<FriendRequest | null> {
    const result = await this.pool.query<FriendRequestRow>(
      `
        UPDATE friend_requests
        SET status = $2, responded_at = $3
        WHERE id = $1
        RETURNING id, from_user_id, to_user_id, status, created_at::text AS created_at, responded_at::text AS responded_at
      `,
      [requestId, status, respondedAt],
    );
    return result.rows[0] ? mapFriendRequest(result.rows[0]) : null;
  }

  async listFriends(userId: string): Promise<User[]> {
    const result = await this.pool.query<UserQueryRow>(
      `
        ${USER_SELECT_SQL}
        JOIN (
          SELECT CASE WHEN from_user_id = $1 THEN to_user_id ELSE from_user_id END AS friend_id
          FROM friend_requests
          WHERE status = 'accepted' AND (from_user_id = $1 OR to_user_id = $1)
        ) fr ON fr.friend_id = u.id
        GROUP BY u.id, s.id
        ORDER BY u.name ASC
      `,
      [userId],
    );
    return result.rows.map(mapUser);
  }

  async countMutualFriends(userA: string, userB: string): Promise<number> {
    const result = await this.pool.query<{ count: string }>(
      `
        WITH a AS (
          SELECT CASE WHEN from_user_id = $1 THEN to_user_id ELSE from_user_id END AS friend_id
          FROM friend_requests
          WHERE status = 'accepted' AND (from_user_id = $1 OR to_user_id = $1)
        ),
        b AS (
          SELECT CASE WHEN from_user_id = $2 THEN to_user_id ELSE from_user_id END AS friend_id
          FROM friend_requests
          WHERE status = 'accepted' AND (from_user_id = $2 OR to_user_id = $2)
        )
        SELECT COUNT(*)::text AS count
        FROM a
        INNER JOIN b USING (friend_id)
      `,
      [userA, userB],
    );
    return Number.parseInt(result.rows[0]?.count ?? "0", 10);
  }

  async getFriendshipStatus(viewerId: string, targetUserId: string): Promise<"self" | "friend" | "public"> {
    if (viewerId === targetUserId) {
      return "self";
    }
    const result = await this.pool.query<{ count: string }>(
      `
        SELECT COUNT(*)::text AS count
        FROM friend_requests
        WHERE status = 'accepted'
          AND ((from_user_id = $1 AND to_user_id = $2) OR (from_user_id = $2 AND to_user_id = $1))
      `,
      [viewerId, targetUserId],
    );
    return Number.parseInt(result.rows[0]?.count ?? "0", 10) > 0 ? "friend" : "public";
  }

  async listFriendsGoing(userId: string, limit: number): Promise<FriendsGoingSignal[]> {
    const result = await this.pool.query<{
      event_id: string;
      event_title: string;
      event_area: string;
      starts_at: string;
      friend_user_id: string;
      friend_name: string;
      friend_profile_photo: string;
    }>(
      `
        WITH friends AS (
          SELECT CASE WHEN from_user_id = $1 THEN to_user_id ELSE from_user_id END AS friend_id
          FROM friend_requests
          WHERE status = 'accepted' AND (from_user_id = $1 OR to_user_id = $1)
        )
        SELECT
          e.id AS event_id,
          e.title AS event_title,
          e.area AS event_area,
          e.starts_at::text AS starts_at,
          u.id AS friend_user_id,
          u.name AS friend_name,
          u.profile_photo AS friend_profile_photo
        FROM event_tickets t
        JOIN friends f ON f.friend_id = t.user_id
        JOIN events e ON e.id = t.event_id
        JOIN users u ON u.id = t.user_id
        WHERE e.starts_at >= NOW()
        ORDER BY e.starts_at ASC
        LIMIT $2
      `,
      [userId, limit],
    );
    return result.rows.map((row) => ({
      eventId: row.event_id,
      eventTitle: row.event_title,
      eventArea: row.event_area,
      startsAt: row.starts_at,
      friendUserId: row.friend_user_id,
      friendName: row.friend_name,
      friendProfilePhoto: row.friend_profile_photo,
    }));
  }

  async listFriendsAttendingEvent(eventId: string, userId: string, limit: number): Promise<User[]> {
    const result = await this.pool.query<UserQueryRow>(
      `
        ${USER_SELECT_SQL}
        JOIN event_tickets t ON t.user_id = u.id
        JOIN (
          SELECT CASE WHEN from_user_id = $2 THEN to_user_id ELSE from_user_id END AS friend_id
          FROM friend_requests
          WHERE status = 'accepted' AND (from_user_id = $2 OR to_user_id = $2)
        ) fr ON fr.friend_id = u.id
        WHERE t.event_id = $1
        GROUP BY u.id, s.id
        ORDER BY u.name ASC
        LIMIT $3
      `,
      [eventId, userId, limit],
    );
    return result.rows.map(mapUser);
  }

  async countFriendsAttendingEvent(eventId: string, userId: string): Promise<number> {
    const result = await this.pool.query<{ count: string }>(
      `
        SELECT COUNT(*)::text AS count
        FROM event_tickets t
        JOIN (
          SELECT CASE WHEN from_user_id = $2 THEN to_user_id ELSE from_user_id END AS friend_id
          FROM friend_requests
          WHERE status = 'accepted' AND (from_user_id = $2 OR to_user_id = $2)
        ) fr ON fr.friend_id = t.user_id
        WHERE t.event_id = $1
      `,
      [eventId, userId],
    );
    return Number.parseInt(result.rows[0]?.count ?? "0", 10);
  }

  async createOrganiserIntake(input: OrganiserIntakeSubmission): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO organiser_intake_submissions (id, name, email, organisation_name, message, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [input.id, input.name, input.email, input.organisationName, input.message, input.createdAt],
    );
  }

  private async findApplicationForUpdate(client: PoolClient, applicationId: string, userId: string) {
    const result = await client.query<EventApplicationRow>(
      `
        SELECT
          id,
          event_id,
          user_id,
          status,
          details_json,
          payment_order_id,
          payment_id,
          ticket_id,
          created_at::text AS created_at,
          updated_at::text AS updated_at
        FROM event_applications
        WHERE id = $1 AND user_id = $2
        LIMIT 1
        FOR UPDATE
      `,
      [applicationId, userId],
    );
    return result.rows[0] ?? null;
  }

  private async findTicketRow(client: Pool | PoolClient, ticketId: string, userId: string) {
    const result = await client.query<TicketRow>(
      `
        SELECT
          id,
          application_id,
          event_id,
          user_id,
          qr_payload,
          issued_at::text AS issued_at
        FROM event_tickets
        WHERE id = $1 AND user_id = $2
        LIMIT 1
      `,
      [ticketId, userId],
    );
    return result.rows[0] ?? null;
  }

  private async findPendingDirection(viewerId: string, targetUserId: string): Promise<"incoming" | "outgoing" | null> {
    const result = await this.pool.query<{ from_user_id: string }>(
      `
        SELECT from_user_id
        FROM friend_requests
        WHERE status = 'pending'
          AND ((from_user_id = $1 AND to_user_id = $2) OR (from_user_id = $2 AND to_user_id = $1))
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [viewerId, targetUserId],
    );
    if (!result.rows[0]) {
      return null;
    }
    return result.rows[0].from_user_id === viewerId ? "outgoing" : "incoming";
  }
}
