# Feedback Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the existing feedback feature into a lightweight user-visible feedback loop with status tracking, admin replies, feedback numbers, and a "My Feedback" page.

**Architecture:** Keep the existing `feedbacks` table, `/api/feedback`, `/api/admin/feedback`, and `/admin/feedback` page. Add only the minimum fields and routes needed for a closed loop: feedback number, five statuses, admin reply, status change timestamp, and a user-facing `/my-feedback` page.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase, TailwindCSS, existing `getRequestAuth` auth helper, existing admin permission table.

---

## File Structure

- Modify: `supabase/migrations/20260621_feedbacks.sql`
  - Keep existing table.
  - Add migration-safe `alter table ... add column if not exists` statements.
  - Add indexes for `feedback_no`, `user_id`, and status.

- Modify: `src/features/feedback/types.ts`
  - Expand `FeedbackStatus`.
  - Add `feedbackNo`, `adminReply`, `statusChangedAt`, `wechatNotifyReserved`.
  - Fix labels to clear Chinese strings.

- Modify: `src/app/api/feedback/route.ts`
  - Generate feedback number.
  - Store current user id if logged in.
  - Return feedback number to frontend.

- Create: `src/app/api/feedback/mine/route.ts`
  - Return current user's own feedback records.
  - Require login.

- Modify: `src/app/api/admin/feedback/route.ts`
  - Read/write new fields.
  - Support five statuses.
  - Support admin reply.
  - Update `status_changed_at` only when status changes.

- Modify: `src/components/feedback/feedback-widget.tsx`
  - After submit, show friendly success text with feedback number.

- Modify: `src/components/admin/feedback-admin-client.tsx`
  - Show feedback number.
  - Add five status filters.
  - Add admin reply textarea.
  - Persist status and admin reply.

- Create: `src/components/feedback/my-feedback-client.tsx`
  - User-facing list of own feedback.
  - Show status, admin reply, submit time, latest update time.

- Create: `src/app/my-feedback/page.tsx`
  - Render `MyFeedbackClient`.

- Modify: `src/components/layout/auth-nav-client.tsx`
  - Add "我的反馈" to logged-in user menu.

---

### Task 1: Database Migration

**Files:**
- Modify: `supabase/migrations/20260621_feedbacks.sql`

- [ ] **Step 1: Add migration-safe columns**

Append this SQL to the existing migration file:

```sql
alter table public.feedbacks
  add column if not exists feedback_no text,
  add column if not exists admin_reply text,
  add column if not exists status_changed_at timestamptz,
  add column if not exists wechat_notify_reserved jsonb default '{}'::jsonb;

update public.feedbacks
set status_changed_at = coalesce(status_changed_at, updated_at, created_at)
where status_changed_at is null;

create unique index if not exists idx_feedbacks_feedback_no
  on public.feedbacks(feedback_no)
  where feedback_no is not null;

create index if not exists idx_feedbacks_user_created
  on public.feedbacks(user_id, created_at desc);
```

- [ ] **Step 2: Add status constraint**

Append this SQL:

```sql
alter table public.feedbacks
  drop constraint if exists feedbacks_status_check;

alter table public.feedbacks
  add constraint feedbacks_status_check
  check (status in ('pending', 'in_progress', 'accepted', 'completed', 'rejected'));
```

- [ ] **Step 3: Run SQL in Supabase**

Open Supabase SQL Editor and run the new SQL block. Expected result:

```txt
Success. No rows returned
```

---

### Task 2: Shared Feedback Types

**Files:**
- Modify: `src/features/feedback/types.ts`

- [ ] **Step 1: Replace status union and item type**

Replace the file content with:

```ts
export type FeedbackType = "bug" | "place_error" | "feature" | "experience" | "other";
export type FeedbackStatus = "pending" | "in_progress" | "accepted" | "completed" | "rejected";

export type FeedbackItem = {
  id: string;
  feedbackNo: string | null;
  userId: string | null;
  type: FeedbackType;
  content: string;
  contact: string | null;
  pageUrl: string | null;
  deviceType: string | null;
  userAgent: string | null;
  status: FeedbackStatus;
  adminNote: string | null;
  adminReply: string | null;
  statusChangedAt: string | null;
  wechatNotifyReserved: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export const feedbackTypeLabels: Record<FeedbackType, string> = {
  bug: "程序问题",
  place_error: "地点信息错误",
  feature: "功能建议",
  experience: "体验问题",
  other: "其他"
};

export const feedbackStatusLabels: Record<FeedbackStatus, string> = {
  pending: "待处理",
  in_progress: "处理中",
  accepted: "已采纳",
  completed: "已完成",
  rejected: "不采纳"
};

export const feedbackStatusOptions: FeedbackStatus[] = ["pending", "in_progress", "accepted", "completed", "rejected"];
```

- [ ] **Step 2: Run build to expose type errors**

Run:

```bat
npm run build
```

Expected: build may fail because API/admin code still expects old statuses. Continue to Task 3.

---

### Task 3: Feedback Submit API

**Files:**
- Modify: `src/app/api/feedback/route.ts`

- [ ] **Step 1: Add feedback number generator**

Add this helper near the top of the file:

```ts
function generateFeedbackNo() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const suffix = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `QM-${yyyy}${mm}${dd}-${suffix}`;
}
```

- [ ] **Step 2: Insert new fields**

In `POST`, before insert:

```ts
const feedbackNo = generateFeedbackNo();
const now = new Date().toISOString();
```

Change insert payload to include:

```ts
feedback_no: feedbackNo,
status: "pending",
status_changed_at: now,
wechat_notify_reserved: {}
```

- [ ] **Step 3: Return feedback number**

Change success response to:

```ts
return NextResponse.json({
  ok: true,
  feedbackNo,
  message: `反馈已提交，编号：${feedbackNo}`
});
```

---

### Task 4: User Feedback API

**Files:**
- Create: `src/app/api/feedback/mine/route.ts`

- [ ] **Step 1: Create route**

Create:

```ts
import { NextResponse } from "next/server";
import type { FeedbackItem, FeedbackStatus, FeedbackType } from "@/features/feedback/types";
import { getRequestAuth } from "@/lib/auth/request-auth";

type FeedbackRow = {
  id: string;
  feedback_no: string | null;
  user_id: string | null;
  type: FeedbackType;
  content: string;
  contact: string | null;
  page_url: string | null;
  device_type: string | null;
  user_agent: string | null;
  status: FeedbackStatus;
  admin_note: string | null;
  admin_reply: string | null;
  status_changed_at: string | null;
  wechat_notify_reserved: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

const selectFields =
  "id,feedback_no,user_id,type,content,contact,page_url,device_type,user_agent,status,admin_note,admin_reply,status_changed_at,wechat_notify_reserved,created_at,updated_at";

function normalize(row: FeedbackRow): FeedbackItem {
  return {
    id: row.id,
    feedbackNo: row.feedback_no,
    userId: row.user_id,
    type: row.type,
    content: row.content,
    contact: row.contact,
    pageUrl: row.page_url,
    deviceType: row.device_type,
    userAgent: row.user_agent,
    status: row.status,
    adminNote: row.admin_note,
    adminReply: row.admin_reply,
    statusChangedAt: row.status_changed_at,
    wechatNotifyReserved: row.wechat_notify_reserved,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { supabase, user, authSource } = await getRequestAuth(request);
  if (!user) {
    return NextResponse.json({ ok: false, items: [], authSource, message: "请先登录后再查看我的反馈。" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("feedbacks")
    .select(selectFields)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) {
    return NextResponse.json({ ok: false, items: [], message: "读取我的反馈失败。" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, items: (data as FeedbackRow[]).map(normalize), authSource });
}
```

---

### Task 5: Admin Feedback API

**Files:**
- Modify: `src/app/api/admin/feedback/route.ts`

- [ ] **Step 1: Expand row type and select fields**

Add fields to `FeedbackRow`:

```ts
feedback_no: string | null;
admin_reply: string | null;
status_changed_at: string | null;
wechat_notify_reserved: Record<string, unknown> | null;
```

Change `feedbackStatuses` to:

```ts
const feedbackStatuses = new Set<FeedbackStatus>(["pending", "in_progress", "accepted", "completed", "rejected"]);
```

Change `selectFields` to:

```ts
const selectFields =
  "id,feedback_no,user_id,type,content,contact,page_url,device_type,user_agent,status,admin_note,admin_reply,status_changed_at,wechat_notify_reserved,created_at,updated_at";
```

- [ ] **Step 2: Update normalize**

Return the new fields:

```ts
feedbackNo: row.feedback_no,
adminReply: row.admin_reply,
statusChangedAt: row.status_changed_at,
wechatNotifyReserved: row.wechat_notify_reserved,
```

- [ ] **Step 3: Support admin reply and status timestamps**

In `PATCH`, read:

```ts
const adminReply = cleanText(body?.adminReply, 1000);
```

Before update, fetch current status:

```ts
const { data: existing } = await supabase.from("feedbacks").select("status").eq("id", id).maybeSingle();
const statusChanged = existing?.status !== status;
```

Use update payload:

```ts
const updatePayload = {
  status,
  admin_note: adminNote || null,
  admin_reply: adminReply || null,
  updated_at: new Date().toISOString(),
  ...(statusChanged ? { status_changed_at: new Date().toISOString() } : {})
};
```

---

### Task 6: Feedback Widget Success Message

**Files:**
- Modify: `src/components/feedback/feedback-widget.tsx`

- [ ] **Step 1: Expand response type**

Change:

```ts
type FeedbackResponse = {
  ok?: boolean;
  message?: string;
  feedbackNo?: string;
};
```

- [ ] **Step 2: Show feedback number**

After successful submit:

```ts
setMessage(result.message ?? `反馈已提交，编号：${result.feedbackNo ?? "待生成"}`);
```

Expected user sees:

```txt
反馈已提交，编号：QM-20260622-8F3A
```

---

### Task 7: My Feedback Page

**Files:**
- Create: `src/components/feedback/my-feedback-client.tsx`
- Create: `src/app/my-feedback/page.tsx`

- [ ] **Step 1: Create client component**

Create a page client that:

- uses `useCurrentUser()`
- calls `/api/feedback/mine`
- displays cards with:
  - feedback number
  - type
  - status
  - content
  - admin reply
  - created time
  - status changed time

Use these exact user-facing empty states:

```txt
请先登录，然后查看你的反馈处理进度。
暂无反馈。你可以点击右下角“反馈”提交问题或建议。
```

- [ ] **Step 2: Create route page**

Create:

```tsx
import { MyFeedbackClient } from "@/components/feedback/my-feedback-client";

export default function MyFeedbackPage() {
  return <MyFeedbackClient />;
}
```

---

### Task 8: Admin UI Upgrade

**Files:**
- Modify: `src/components/admin/feedback-admin-client.tsx`

- [ ] **Step 1: Use shared status options**

Import:

```ts
import { feedbackStatusLabels, feedbackStatusOptions, feedbackTypeLabels } from "@/features/feedback/types";
```

Change status options to:

```ts
const statusOptions: Array<FeedbackStatus | ""> = [...feedbackStatusOptions, ""];
```

- [ ] **Step 2: Show feedback number**

In each feedback card header, show:

```tsx
{item.feedbackNo ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{item.feedbackNo}</span> : null}
```

- [ ] **Step 3: Add admin reply textarea**

Add a controlled draft map:

```ts
const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
```

When loading items:

```ts
setReplyDrafts(Object.fromEntries((filteredResult.items ?? []).map((item) => [item.id, item.adminReply ?? ""])));
```

Add textarea in each card:

```tsx
<textarea
  value={replyDrafts[item.id] ?? ""}
  onChange={(event) => setReplyDrafts((value) => ({ ...value, [item.id]: event.target.value }))}
  placeholder="给用户看的处理回复，例如：已核实，图片信息已更新。"
  className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
/>
```

- [ ] **Step 4: Persist admin reply**

Change PATCH body to:

```ts
body: JSON.stringify({
  id: item.id,
  status: nextStatus,
  adminNote: item.adminNote ?? "",
  adminReply: replyDrafts[item.id] ?? ""
})
```

Add a "保存回复" button that calls `updateStatus(item, item.status)`.

---

### Task 9: Navigation Entry

**Files:**
- Modify: `src/components/layout/auth-nav-client.tsx`

- [ ] **Step 1: Add my feedback menu item**

Add this to Chinese logged-in nav items near "我的投稿":

```ts
{ href: "/my-feedback", label: "我的反馈", authOnly: true },
```

Add English equivalent:

```ts
{ href: "/my-feedback", label: "My Feedback", authOnly: true },
```

---

### Task 10: Verification

**Files:**
- All modified files

- [ ] **Step 1: Build**

Run:

```bat
npm run build
```

Expected:

```txt
Compiled successfully
```

- [ ] **Step 2: Manual user test**

Open:

```txt
/
```

Submit feedback from the floating feedback button. Expected:

```txt
反馈已提交，编号：QM-...
```

- [ ] **Step 3: My feedback test**

Open:

```txt
/my-feedback
```

Expected:

```txt
Shows the submitted feedback number, status 待处理, and content.
```

- [ ] **Step 4: Admin test**

Open:

```txt
/admin/feedback
```

Change status to `处理中`, add admin reply, save. Expected:

```txt
Status updates successfully, reply appears on /my-feedback.
```

- [ ] **Step 5: Deploy**

Commands:

```bat
git add supabase\migrations\20260621_feedbacks.sql src\features\feedback\types.ts src\app\api\feedback\route.ts src\app\api\feedback\mine\route.ts src\app\api\admin\feedback\route.ts src\components\feedback\feedback-widget.tsx src\components\feedback\my-feedback-client.tsx src\app\my-feedback\page.tsx src\components\admin\feedback-admin-client.tsx src\components\layout\auth-nav-client.tsx
git commit -m "Upgrade feedback loop"
git push
```

Do not add:

```txt
tsconfig.tsbuildinfo
```

---

## Self-Review

- Spec coverage: all requested statuses, admin reply, my feedback page, progress visibility, feedback number, admin status update, status timestamp, and WeChat notification reservation are covered.
- Placeholder scan: no TBD/TODO placeholders.
- Scope check: this remains a lightweight feedback loop, not a customer service system.
- Type consistency: `FeedbackStatus`, `FeedbackItem`, API normalization, and UI labels share the same status names.
