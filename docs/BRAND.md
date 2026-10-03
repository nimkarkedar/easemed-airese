# Airese brand brief

The source of truth for how Airese looks and talks. Read this before you design a screen or write any copy.

Sources:
- *Airese Voice and Tone* deck (for review, October 2026)
- *Airese Visual Language (Mood Board)* deck (October 2026)

Both are still awaiting sign-off. When this file and the code disagree, this file wins. Update the code, or update this file if the decks change.

---

## 1. What Airese is

> **Airese shows people what happened while they slept and helps them decide what to do next.**

- A **B2C phone app** from **Easmed**. It records the night through the phone microphone and detects snoring and paused breathing. No watch or mat is needed.
- **Why it exists:** up to 80% of sleep apnoea cases go undiagnosed (Peppard et al., *Am J Epidemiol*, 2013, cited by Apple Health). Users think "it's just snoring."
- **Business goal:** move people from "It's just snoring" to "I should get this checked." Users become **leads** when they share a report with a doctor or contact Easmed.
- **How we're different:** Apple, Samsung and Withings need a watch or a mat. SnoreLab and Sleep Cycle stop at the recording. Airese works on a phone and can point to a next step.

### The user journey

**Dismissal → Curiosity → Evidence → Understanding → Concern → Action**

Each step needs its own message. Jumping straight from dismissal to fear makes people delete the app.

What snorers say before they hear a recording: "I didn't know that I snored at all." After a recording: "…and actually heard myself." **Recordings are the main proof.**

---

## 2. Product principles

Taken from the competitor research.

| Learned from | Principle |
| --- | --- |
| SnoreLab | Recordings are the main proof. |
| Sleep Cycle | Assume two people in the room (tell the user apart from their partner). |
| Oura | One headline number first, detail on tap. |
| Apple Health | Privacy wording in one short line. |
| Samsung Health Monitor | Flag something only after several nights. |
| Withings | Claim only what we've validated. |
| Healthdirect (AU) | Recordings can go to the GP, in place of the partner describing the night. |

---

## 3. Voice and tone

### Four principles

| Principle | Means | ✗ Avoid | ✓ Use |
| --- | --- | --- | --- |
| **Plain** | Words a sleepy person understands at 6 am | 17 respiratory events detected. | Your breathing was interrupted 17 times last night. |
| **Factual** | Say what we heard, not what we infer | You may have sleep apnoea. | Your breathing paused often last night. |
| **Calm** | Not pushy, alarming or intimidating | Poor sleep detected. | Last night was more broken than usual. |
| **Useful** | Every message helps the user take a next step | Consult a doctor immediately. | Hear what happened at 2:14 am. |

### Where Airese sits on each scale

| Scale | Position | Example |
| --- | --- | --- |
| Clinical ↔ Conversational | Leans conversational | You snored for 48 minutes, mostly after 3 am. |
| Alarming ↔ Reassuring | Leans reassuring | One night is hard to read on its own. We'll see how the week looks. |
| Technical ↔ Plain | Plain | Your breathing paused 12 times. |
| Judging ↔ Observing | Strongly observing | You moved around more than usual. |
| Gentle ↔ Direct | Middle, slightly gentle | This is worth getting checked. |

### Two ways to get it wrong

- **Too scary:** "Warning: signs of sleep apnoea detected." People panic, or leave.
- **Too soft:** "Interesting night! Tap to take a look." People never act.

### The escalation ladder

Airese gets more serious over time. **Each step unlocks only when the data supports it. Engineering and Clinical set the thresholds.**

| # | Step | Example |
| --- | --- | --- |
| 1 | Notice | You snored for 42 minutes. |
| 2 | Compare | That's more than your usual. |
| 3 | Spot a pattern | 4 of the last 7 nights. |
| 4 | Explain | Loud, frequent snoring can come with paused breathing. |
| 5 | Suggest | Worth mentioning to a doctor. |
| 6 | Help them act | Share your report. |

### The pattern screen: where users become leads

The message names the pattern and offers **one** action. This screen gets tested the most.

```
This week
5 of 7 nights
Your breathing paused often on 5 of the last 7 nights.
This is worth getting checked by a doctor.

[ Share report with a doctor ]   ← primary
  Contact Easmed                 ← quiet
```

Wording and thresholds depend on what Engineering can detect with confidence.

### Same voice, different moments

| Moment | Feels | Airese says |
| --- | --- | --- |
| First open | Curious | Let's find out what happens while you sleep. |
| Mic permission | Upfront | Airese listens all night for snoring and breathing. Your data stays on your device. Private and safe. |
| Good night | Quiet | A steadier night. |
| A recording | Matter of fact | 2:14 am. 40 seconds. Have a listen. |
| Sharing with a partner | Kind | Here's what last night sounded like. |
| No data | Helpful | We couldn't hear enough last night. Try your phone closer to the bed. |
| Getting better | Encouraging | Your breathing was steadier this week. |

### Wording swaps

| ✗ Avoid | ✓ Use |
| --- | --- |
| Snore score 82. Critical. | You snored for 1 hr 20 min, mostly after 3 am. |
| Severe snoring detected | You snored more than usual. |
| Upper airway obstruction | Your airway narrowed while you slept. |
| You crushed it! | A steadier night. |
| You failed to hit 7 hours | You slept 5 hr 40 min. |

### Off limits

- Diagnosing
- Blaming weight, age or drinking
- Inventing urgency
- Comparing the user to "normal people"
- Badges or streaks for sleep
- Claiming more than the tech can detect

### One finding across channels

The finding: *breathing paused often on 4 of 7 nights.*

| Channel | Says |
| --- | --- |
| App | Your breathing was interrupted more often this week. |
| Push | There's a pattern worth looking at this week. |
| Email | Your weekly sleep report is ready. |
| Doctor report | Breathing disturbances on 4 of 7 recorded nights, 26 Sep to 2 Oct. Audio attached. |
| Ad | Record your snoring tonight with just your phone. Privately. |

The doctor report gets exact dates and counts. The ad stays general.

### Success measures

- More users go from a flagged pattern to sharing a report or booking.
- People keep using the app for more than one night.
- Fewer people turn off notifications.
- First A/B test: two versions of the "worth getting checked" message.

---

## 4. Visual language

### Same data, different reader

Easmed's medical B2B tools and Airese show the same data, but they're built differently.

| Medical B2B | Airese B2C |
| --- | --- |
| Dense data | Important data first |
| Clinical language | Everyday language |
| White and blue | **Night-appropriate dark UI** |
| Designed for interpretation | Designed for understanding |
| Utility first | Utility + comfort |
| **Clinical accuracy** | **Clinical accuracy** |

**Interaction model:** Glance. Understand. **Act.**

**Feels like:** Calm · Clear · Private · Trustworthy · Modern · **Medical, not clinical**

**Big no:** hospital software, meditation app, fitness dashboard, AI sci-fi, scary warnings, novelty snore app.

### Take from the references

- **Plain words:** a score explained in a sentence ("Excellent").
- **Sentence first:** a sentence above every chart ("Here are the sleep stages from your recent night's sleep.").
- **Listen:** "Listen to your sleep" next to the headline number.
- **Hierarchy:** one big headline, then the key numbers.
- **Timeline:** the night on a time axis, with snore events marked.

### Leave out

- **Mascots**
- **Rings and awards**
- **Comparing with other people or countries**
- **Paywalls over the data**
- **Clutter**

### Colour: "Night, with one warm light"

| Name | Hex | Role (proposed) |
| --- | --- | --- |
| Night | `#05070F` | Deepest background |
| Midnight | `#0B1020` | App background |
| Deep | `#19294E` | Cards and sheets (deck had `#131B2E`; changed by design, Oct 2026) |
| Mist | `#B3BDD3` | Secondary and muted text (deck had `#93A0BB`; lightened to pass WCAG AAA) |
| Moon | `#EEF1F7` | Primary text |
| Breath | `#9DB4FF` | Cool accent: breathing data, links |
| Lamp | `#F4B65F` | **The one warm light.** Use sparingly for the key number or the action. |

Lamp is the only warm colour. **No red** (calm, never alarming).

### Type

| Use | Font |
| --- | --- |
| Headings | **Montserrat** (bold) |
| Body | **Inter** |
| Data (times, durations) | **Monospace**, often in Lamp: `2:14 am · 42 min` |

**Type scale** (`type` in `src/theme/tokens.ts`). The base is 16 and the steps are about 1.25×. Reading text has a line height of at least 1.5×. **No text smaller than 12.**

| Style | Size / line height | Weight | Use |
| --- | --- | --- | --- |
| `title` | 32 / 40 | Bold | Rare, big single statements |
| `headline` | 24 / 32 | Bold | Screen headline (onboarding) |
| `heading` | 20 / 28 | Bold | Section and sheet titles |
| `body` | **16 / 24** | Regular | Base: all reading text |
| `small` | 14 / 22 | Regular | Secondary detail |
| `caption` | 12 / 18 | Regular | The minimum: credits, fine print |
| `button` | 16 / 20 | Bold | Button labels |

### Accessibility: WCAG 2.2 AAA

The design system targets **WCAG 2.2 Level AAA**. Every new screen must keep to these rules.

- **Text contrast of at least 7:1**, and 4.5:1 for large text (24 regular or 19 bold and up). Use the colour roles; they're checked.
- **Icons, controls and state indicators: at least 3:1** against what's behind them.
- **Touch targets of at least 44 × 44 pt.** If the visible mark is smaller, pad the tap area, as the page dashes do.
- **No text smaller than 12.** Reading text has a line height of at least 1.5×.
- **Text scales with the system setting up to 200%** (`AppText` allows ×2). Layouts must grow, not clip.
- **Reduce Motion is respected** (`useReducedMotion`): no slides, drift, parallax or breathing. Fades stay.
- **Every gesture has a tap alternative.** The carousel can be swiped, or moved with the dashes.
- **Screen readers:** headlines are marked as headers, decorative art is hidden, and controls have labels and state (for example "Page 2 of 3, selected").
- **Plain language** at a lower-secondary reading level (see Voice and tone).

**Checked pairs**

| Pair | Contrast | Needed |
| --- | --- | --- |
| Moon text on Midnight | 16.7 : 1 | 7 |
| Moon text on Deep (sheet) | 12.6 : 1 | 7 |
| Mist text on Midnight | 10.0 : 1 | 7 |
| Mist text on Deep (sheet) | 7.6 : 1 | 7 |
| Midnight label on Breath button | 9.4 : 1 | 7 |
| Moon caption on splash gradient | 10.5 : 1 (5.1 at the brightest blue) | 7 |
| Inactive page dash (Moon at 45%) | 4.1 : 1 | 3 |
| Info icon, sheet handle | 7.6 : 1 or more | 3 |

### Icons

**Google Material Symbols (Material 3)**: Outlined style, weight 400. Use the `Icon` component (`src/components/Icon.tsx`), which draws the official paths. To add an icon, copy its path from `@material-symbols/svg-400/outlined/<name>.svg`. Don't mix in other icon sets.

### Motion

**One calm, unhurried feel for the whole app**, like settling down for the night. Every curve starts softly and lands softly. Nothing snaps, bounces or overshoots.

There are two presets in `src/theme/motion.ts`. Every animation uses one of them; don't hand-tune timings per screen. Design decides which preset applies where.

| Preset | Duration | easeOut (arriving) | easeIn (leaving) | easeInOut (between states) |
| --- | --- | --- | --- | --- |
| **slow**: elegant, smooth | 1200 ms | cubic-bezier(0.3, 0, 0.2, 1) | cubic-bezier(0.47, 0, 0.745, 0.715) | cubic-bezier(0.37, 0, 0.63, 1) |
| **fast**: a little snappier | 500 ms | cubic-bezier(0.2, 0, 0, 1) | cubic-bezier(0.4, 0, 0.8, 0.4) | cubic-bezier(0.45, 0, 0.2, 1) |

Also: `ambient` (9 s sine loop, for background breathing) and `stagger` (350 ms offset between overlapping elements).

**Where each is used so far**

| Animation | Preset |
| --- | --- |
| Splash: logo and subtext arriving, falling away | slow |
| Onboarding: illustration fading in | slow |
| Onboarding: Next / Continue buttons | none (part of the page; they swipe with the text) |
| Permission screens: graphic | none (there on load) |
| Bottom sheet: appearing and closing | fast |
| Bottom sheet: settling back after a short drag | fast |

Overlap steps instead of chaining them, so motion flows. Swipes and scrolls follow the finger, with no easing. Respect the system Reduce Motion setting.

### Imagery

**Black and white. Deep blue. Real.** Use real people asleep in a dim room, toned blue, with an occasional warm bedside lamp. Show couples (the partner who hears the snoring). Avoid stock-photo cheer and sci-fi glow.

### Reference screens (mood board)

**"Last night" on phone:**
- Date, then the "Last night" title, then "Here's what we detected while you slept."
- A big **42 min** snoring-time card, with "8% of your sleep" and "Your usual is 15–25 min."
- A snoring timeline (12 am to 6 am) with snore events marked.
- A "Snoring example" audio clip: "2:14 AM · 00:40 · Have a listen."
- A privacy row: "Your data stays on this iPhone."

**Watch:** "Recording tonight" with an elapsed-time ring, and a morning summary: "42m snoring · Mostly 2–4 AM."

---

## 5. Open questions

- **Light vs dark: settled, dark.** `src/theme/tokens.ts` now maps its roles to the night palette: background is Midnight, surface Deep, text Moon, muted text Mist.
- **Navy `#2E3A5A`.** It's the logo and deck colour. Is it still used in the app, or only for marketing?
- **Monospace font** for data isn't named in the deck.
- **Mood-board mockups** use reddish snore bars and an "up-arrow, more than your usual" badge. Both conflict with "no red / no scary warnings". Use Lamp in their place.
- **Splash gradient blues.** The splash (Figma "iPhone 16 & 17 Pro - 1") fades from Midnight `#0B1020` (Figma had `#16131B`; changed so the splash hands over seamlessly to the Midnight app background) through `#1C3470` to `#225ED8`. These blues aren't in the deck palette; Breath `#9DB4FF` is the only blue there. They live in `gradients.splash` in `src/theme/tokens.ts`. Decide whether this blue joins the palette (for example as a brand blue) or stays splash-only.
- **Sign-off pending** on the four principles, the mood, and Engineering's confidence thresholds for the ladder.
