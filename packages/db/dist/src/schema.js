import { pgTable, uuid, varchar, jsonb, boolean, timestamp, integer, text, index, uniqueIndex, date } from 'drizzle-orm/pg-core';
export const tenants = pgTable('tenants', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 200 }).notNull(),
    subdomain: varchar('subdomain', { length: 80 }).notNull(),
    status: varchar('status', { length: 20 }).default('active').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (t) => ({ subdomainIdx: uniqueIndex('ux_tenant_subdomain').on(t.subdomain) }));
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    role: varchar('role', { length: 40 }).notNull(), // owner, staff, operator, approver, super
    passwordHash: varchar('password_hash', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (t) => ({
    tenantEmailIdx: uniqueIndex('ux_users_tenant_email').on(t.tenantId, t.email)
}));
export const brandProfiles = pgTable('brand_profiles', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    companyName: varchar('company_name', { length: 200 }).notNull(),
    tagline: varchar('tagline', { length: 200 }),
    description: text('description'),
    contact: jsonb('contact'), // phone, whatsapp, email
    address: jsonb('address'),
    primaryColor: varchar('primary_color', { length: 20 }),
    secondaryColor: varchar('secondary_color', { length: 20 }),
    fontPrimary: varchar('font_primary', { length: 80 }),
    fontSecondary: varchar('font_secondary', { length: 80 }),
    logoUrl: varchar('logo_url', { length: 1024 })
});
export const assets = pgTable('assets', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    url: varchar('url', { length: 1024 }).notNull(),
    type: varchar('type', { length: 40 }).notNull(), // image|logo
    width: integer('width'),
    height: integer('height'),
    sizeKb: integer('size_kb'),
    uploadedBy: uuid('uploaded_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (t) => ({ idx: index('ix_assets_tenant_created').on(t.tenantId, t.createdAt) }));
export const imageTemplates = pgTable('image_templates', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 120 }).notNull(),
    aspectRatio: varchar('aspect_ratio', { length: 10 }).notNull(), // 1:1, 4:5
    layers: jsonb('layers').notNull(),
    isActive: boolean('is_active').default(true).notNull()
});
export const generatedImages = pgTable('generated_images', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    templateId: uuid('template_id').references(() => imageTemplates.id),
    title: varchar('title', { length: 200 }),
    caption: text('caption'),
    hashtags: varchar('hashtags', { length: 500 }),
    outUrl: varchar('out_url', { length: 1024 }).notNull(),
    aspectRatio: varchar('aspect_ratio', { length: 10 }).notNull(),
    width: integer('width'),
    height: integer('height'),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (t) => ({ idx: index('ix_genimg_tenant_created').on(t.tenantId, t.createdAt) }));
export const posts = pgTable('posts', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    platform: varchar('platform', { length: 20 }).notNull(), // facebook|instagram
    mediaUrl: varchar('media_url', { length: 1024 }).notNull(),
    caption: text('caption'),
    hashtags: varchar('hashtags', { length: 500 }),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    status: varchar('status', { length: 20 }).default('draft').notNull(), // draft|queued|posted|failed
    remotePostId: varchar('remote_post_id', { length: 120 }),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (t) => ({ idx: index('ix_posts_tenant_sched').on(t.tenantId, t.scheduledAt) }));
export const socialConnections = pgTable('social_connections', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    platform: varchar('platform', { length: 20 }).notNull(),
    pageId: varchar('page_id', { length: 120 }),
    igBusinessId: varchar('ig_business_id', { length: 120 }),
    accessTokenEnc: text('access_token_encrypted'),
    refreshExpiresAt: timestamp('refresh_expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});
export const subscriptions = pgTable('subscriptions', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    planName: varchar('plan_name', { length: 60 }).default('basic'),
    priceInr: integer('price_inr').default(600),
    monthlyImageCredits: integer('monthly_image_credits').default(5),
    currentCycleStart: date('current_cycle_start').notNull(),
    currentCycleEnd: date('current_cycle_end').notNull(),
    status: varchar('status', { length: 20 }).default('active').notNull()
});
export const usageLedger = pgTable('usage_ledger', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    feature: varchar('feature', { length: 40 }).notNull(), // image_generation
    amount: integer('amount').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});
