# Restaurant Operator Drip — six-message sequence

The gated drip that goes to operators who save a tool result, download an
audit PDF, or fill out the intake form on /window/. Six messages over six
weeks; quarterly cadence after that. Authored by Don, voiced first-person,
mid-formal — same contract as the rest of the site (see [/methods/#voice-contract](https://muntin.digital/methods/#voice-contract)).

Pasted into Buttondown one-by-one when a new contact enters the list. The
trigger is the segment field `intent_source` set on subscription:

| `intent_source` | Path                                       |
| --------------- | ------------------------------------------ |
| `tool-save`     | Saved a tool result via Workshop           |
| `audit-pdf`     | Downloaded the free audit PDF              |
| `intake`        | Filled out /window/ with a project intent  |

All three intents share the same six-message sequence. The drip kicks off
24 hours after subscription, then every 7 days for messages 2–6. After
message 6, the contact moves to the quarterly Library Letter list.

## Voice ground rules

- First-person singular ("I"), one human, named when it matters. Never "we."
- Short declaratives. One mid-sentence em-dash maximum.
- No exclamation marks. No emoji. No "just" / "simply" / "easy."
- Plain text. No HTML. No images. No tracking pixels (the unsubscribe link
  Buttondown ships is enough).
- Subject line under 60 characters. Preview under 90.
- Sign-off is "— Don," nothing more.

## Files

| File                    | Trigger          | Day | Subject (under 60ch)                                   |
| ----------------------- | ---------------- | --- | ------------------------------------------------------ |
| `01-welcome.md`         | T+24h            | 1   | A note from Don, with what to expect                   |
| `02-audit-prompt.md`    | T+7d             | 8   | The leak you most likely have                          |
| `03-case-study.md`      | T+14d            | 15  | What happened when Tacombi rebuilt                     |
| `04-pricing.md`         | T+21d            | 22  | Posted pricing, in writing                             |
| `05-care-plan.md`       | T+28d            | 29  | The cheapest mistake to prevent                        |
| `06-direct-ask.md`      | T+35d            | 36  | One direct question, then I'll get out of your inbox   |

## Send-time policy

- Tuesday–Thursday only. Send at 10:30am ET (mid-morning, between breakfast
  rush and lunch prep — when independent operators read email).
- Skip US holidays and the week of Thanksgiving / Christmas / New Year.
- If the contact replies to any message, the drip pauses. I reply manually
  and re-enroll only if the conversation closes inside 7 days.

## What the drip does NOT do

- No "Open the email!" copy in the preview text. The preview previews.
- No "P.S. — only 3 spots left this month" scarcity. The site posts capacity
  ([/about/](https://muntin.digital/about/)) and that's where it lives.
- No tracking pixels, no UTM tagging on links to my own site. The
  reader's privacy is the reader's privacy.
- No reply-to noreply addresses. Every message is from `don@muntin.digital`,
  hits my real inbox, and I read it.
