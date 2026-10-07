# Airese: product requirements

What Airese does, screen by screen and module by module, as built in the prototype. Written for Easmed's product, engineering and clinical teams, and anyone joining the project.

| | |
| --- | --- |
| Product | Airese, by Easmed. Powered by The Air Station. |
| Platforms | iOS and Android phones (Expo / React Native). A browser preview exists for review only. |
| Status | Prototype for engineering handover, October 2026. Version 0.1.0. |
| Live prototype | https://nimkarkedar.github.io/easemed-airese/ |
| Related docs | [BRAND.md](BRAND.md): voice, tone, colour, type, accessibility. [RECORDING.md](RECORDING.md): how long a recording runs, and why. |

**How to read this document.** Each module lists what it does, what the user sees, and its rules. Items marked **To confirm** need a decision from Product, Clinical, Legal or Engineering before release. Items marked **Prototype** behave differently in the prototype (usually sample data) and say what the real app must do.

When this document and the code disagree, raise it: either the code has a bug or this document is out of date.

---

## Contents

1. [Product summary](#1-product-summary)
2. [Principles](#2-principles)
3. [Scope](#3-scope)
4. [App map and navigation](#4-app-map-and-navigation)
5. [Modules](#5-modules)
   - 5.1 [Splash](#51-splash)
   - 5.2 [Onboarding walkthrough](#52-onboarding-walkthrough)
   - 5.3 [Permissions](#53-permissions)
   - 5.4 [Your details (onboarding)](#54-your-details-onboarding)
   - 5.5 [Home](#55-home)
   - 5.6 [Night Notes](#56-night-notes)
   - 5.7 [Recording](#57-recording)
   - 5.8 [Recording Details](#58-recording-details)
   - 5.9 [Recordings](#59-recordings)
   - 5.10 [Profile](#510-profile)
   - 5.11 [Notifications](#511-notifications)
6. [Measures and how they're calculated](#6-measures-and-how-theyre-calculated)
7. [The escalation ladder](#7-the-escalation-ladder)
8. [Privacy and data](#8-privacy-and-data)
9. [Design system and accessibility](#9-design-system-and-accessibility)
10. [Technical notes for engineering](#10-technical-notes-for-engineering)
11. [Success measures](#11-success-measures)
12. [Decisions and open questions](#12-decisions-and-open-questions)
13. [Glossary](#13-glossary)

---

## 1. Product summary

**Airese shows people what happened while they slept and helps them decide what to do next.**

- **What it does:** records the night through the phone's microphone, detects snoring and paused breathing, plays back the moments that matter, and shows how each night compares with the user's own usual. No watch or mat is needed.
- **The problem:** up to 80% of sleep apnoea cases go undiagnosed. People think "it's just snoring."
- **The business goal:** move people from "it's just snoring" to "I should get this checked." A user becomes a lead when they talk to The Air Station's sleep care team or share a report with a doctor.
- **How it's different:** Apple, Samsung and Withings need a watch or a mat. SnoreLab and Sleep Cycle stop at the recording. Airese works on a phone and points to a next step.

### Who it's for

- **The snorer**, often prompted by a partner. Usually not technical. Reads the results groggy, at about 6:30 am.
- **The partner**, who hears the snoring and often pushes for action.
- **The curious and the doctor**, who want the detail behind the headline. They get it one level down (the night report), never on the main page.

### The user journey

**Dismissal → Curiosity → Evidence → Understanding → Concern → Action.** Each step needs its own message. Jumping from dismissal straight to fear makes people delete the app. Hearing yourself snore is the moment that creates belief; repeated evidence over several nights is what leads to action.

---

## 2. Principles

Full detail in [BRAND.md](BRAND.md). The ones that shape requirements:

- **Recordings are the proof.** Every results screen leads to something the user can hear.
- **Evidence, not alarm.** Real data can look striking; words stay calm. Airese escalates only when a pattern repeats (section 7).
- **One headline first, detail on tap.** Three levels: glance (everyone), explore (engaged users), report (the curious and doctors).
- **Plain, factual, calm, useful.** Say what was heard, never diagnose, never compare with other people.
- **Compare with yourself.** "Usual" means the user's own recent nights.
- **Private by design.** Sound is analysed on the phone; recordings stay on the device.
- **Claim only what's validated.** No number appears unless Engineering and Clinical stand behind it.

---

## 3. Scope

### In the prototype

Splash, onboarding walkthrough, microphone and notification permissions, your details, Home (tips, Night Notes, record button), the Recording screen, Recording Details (six states), the Recordings list, Profile (details, notifications, sleep care, centres, about, your data).

### Not yet built

| Item | Notes |
| --- | --- |
| Sign-in, sign-out, accounts | Everything is on the phone. "Erase everything" replaces "delete account". |
| Real audio capture and analysis | All results use sample data generated per night (section 10). |
| Sharing a report with a doctor | The night report exists; sharing or exporting it doesn't. |
| Callback request flow | "Request a callback" closes the sheet; contact details and consent still to design. |
| Notification delivery | Preferences are stored; nothing is scheduled. |
| Partner sharing ("send this clip") | Proposed, needs a privacy design. |
| Remedy experiments ("did mouth tape help?") | Night Notes are captured but not yet compared across nights. |
| Photo upload | Out of scope by decision. |

---

## 4. App map and navigation

```
Splash ─► Onboarding walkthrough ─► Microphone ─► Notifications ─► Your details ─► Home
                                                                                   │
  Tabs: Home ◄────────────────────────────────────────────────────────────► Recordings
   │                                                                         │
   ├─ Night Notes (push)                                                     ├─ Recording Details (push)
   ├─ Record button ─► Recording (full screen) ─► stop ─► Recording Details  │    └─ sheets: scores, snoring,
   └─ Avatar ─► Profile (push)                                               │       breathing, sleep, clips,
                 ├─ Your details (push)                                      │       recent nights, night report
                 ├─ Notifications (push)                                     └─ Avatar ─► Profile
                 └─ Our centres (push)
```

- **Tabs:** Home and Recordings, in a floating tab bar.
- **Pages opened from a row** (Recording Details, Night Notes, Profile and its pages) use the system push on device (slide in, swipe back). The browser preview slides them in itself.
- **Back** names where it goes ("‹ Home", "‹ Recordings", "‹ Profile").
- **Sheets** (bottom sheets and large sheets) hold explanations, confirmations and "more" for a card. They close with a tap outside, a drag down, the × button, or Android back.
- **Recording** is a full-screen takeover with no swipe-back, so a half-asleep gesture can't end the night.

---

## 5. Modules

### 5.1 Splash

- **Shows:** the Airese logo on the night gradient, settling in with the slow motion preset.
- **Then:** falls away into the onboarding walkthrough.
- **Rules:** no loading text, no tagline.

### 5.2 Onboarding walkthrough

Three slides, each with an illustration, a headline, two lines of body and an (i) for more in a sheet.

| # | Headline | Body |
| --- | --- | --- |
| 1 | Know your sleep. | Track how you sleep. See the patterns. |
| 2 | Completely private. | Your data stays on your device. Everything is stored locally. |
| 3 | Get actionable insights | Understand your sleeping behaviour. Seek care as required. |

- **Next** moves through the slides; **Continue** fades in on the last.
- **Skip** sits below the status bar, top right.

### 5.3 Permissions

Two screens in onboarding, then a second chance in context whenever a permission is off. Never a wall: "Skip" and "Not now" always move on.

#### Microphone

- **Onboarding screen:** "Let Airese listen while you sleep." / "Allow microphone access to capture snoring and breathing. Recordings stay private on your device unless you choose to share them." Button: **Allow microphone**.
- **System prompt text (iOS):** "Airese listens while you sleep to capture snoring and breathing. Recordings stay on your device unless you choose to share them."
- **If off:** Home pins "Microphone is off. Airese needs it to record your night." with **Turn on**. Tapping the record button also asks, then starts recording once allowed. Profile → Settings shows the status with **Turn on**.

#### Notifications

- **Onboarding screen:** "Turn on notifications." / "We'll remind you to start recording, and let you know when it stops. Just two notifications a day."
- **If off:** a tip on Home ("Turn on notifications for a bedtime reminder.") and Profile → Notifications show **Turn on**.

#### The second-chance sheet

Its message depends on where the permission stands:

| State | Message | Button |
| --- | --- | --- |
| Not asked yet, or skipped | Why it matters | Allow (shows the system prompt) |
| Said no | What's missing and how to turn it on | Open Settings (iOS asks only once) |

Coming back from Settings with the permission on continues automatically.

> **To confirm:** the notification copy says "two a day" (a reminder to start, a note when it stops). The product now has three optional notifications and no automatic stop note (section 5.11). Rewrite the onboarding and sheet copy to match.

### 5.4 Your details (onboarding)

The last onboarding step: "Great! One last thing…"

| Field | Rules |
| --- | --- |
| First name, last name | Optional. Words capitalised. |
| Year of birth | One four-digit input (no wheels). 1900 to this year. Errors: "Use four digits, like 1985." / "That year doesn't look right. Check it and try again." (i) explains why it's asked. |
| Email | Optional. Checked on leaving the field: "Check your email address." Footer: "Verify to get your report" with a **Verify** link (flow to design). |

- Native grouped form (iOS Settings style).
- Errors outline the group in the error colour and show an icon with the message.

### 5.5 Home

The bedtime screen. One job: start a night's recording.

**Layout, back to front:**

1. A night-to-blue gradient with a slow, faint drift of light.
2. **The tip sheet** behind the panel. The charging tip is always in view; pull the panel down (or tap the grabber) to see more.
3. **The panel**, which holds Night Notes and the record button.

**Header:** "Home" and the avatar (initials, or a person icon). The avatar opens Profile.

**Tips** (plain, factual; a few at random each visit):

- Keep your phone on charge tonight. Sleep tracking can use more battery than usual. *(always first)*
- Put your phone on your bedside table, close to your pillow.
- Sharing a bed? Keep your phone on your side for the clearest recording.
- Turn on Do Not Disturb. Calls and alerts stay quiet, and Airese keeps recording.
- Updates, only when true: "Your breathing was steadier last night than your usual." / "2:14 am. 40 seconds. Have a listen…"
- Permission tips (section 5.3) when one is off, with **Turn on**.

**Night Notes row:** shows tonight's notes, or "Add sleep context". After the first night, a gentle caution mark appears while tonight's notes are empty.

**Record button:**

- **Tap to start.** The ring of ticks lights up quickly, then recording begins and the screen fills with blue from the button.
- **At rest:** the button breathes very gently, and now and then a light runs round the ring.
- **Under it:** "Tap to start recording" / "Completely private. Recorded on your phone."
- **No stop time to set.** Recording runs until the user stops it (section 5.7).

### 5.6 Night Notes

A 15-second check-in before recording. Natural questions with tap-to-choose pills, not a form.

| Question | Options |
| --- | --- |
| How are you feeling? | Blocked nose, Sick, Exhausted, Dehydrated, Period |
| Anything before bed? | Alcohol, Caffeine, Ate late, Worked out, Smoking, Sedatives |
| Sleeping somewhere different? | Not my bed |
| Using anything tonight? (remedies, in a sheet) | **Sleep position:** Side sleeping, Wedge pillow, Positional therapy, Anti snore pillow. **Nose:** Nasal strip, Nasal dilator, Nasal spray, Neti pot, Allergy relief. **Mouth & throat:** Mouthpiece, Tongue retainer, Mouth tape, Throat spray, Chin strap. **Room:** Air purifier, Humidifier |

- **"Same as last night?"** appears once there are earlier notes, with **Use previous notes**. A small **Forget previous notes** link clears them.
- **Done · 3 selected** saves the notes; Back leaves without saving.
- Notes attach to the night when recording stops.

### 5.7 Recording

The full rule set and its reasons are in [RECORDING.md](RECORDING.md).

**The rule:** start with a tap at bedtime, stop with a tap when you wake. Nothing to set in between.

| | |
| --- | --- |
| Start | Tap the record button on Home. |
| Stop | Tap the stop button, then confirm: "Stop recording?" / "Airese will look through your night." **Stop recording** · **Keep recording**. |
| After stopping | Straight to Recording Details: "Looking through your night", then the results. |
| Safety net | Stops by itself after **12 hours** (battery and storage). |
| Scheduled start | None: iOS and Android 14+ don't allow switching the microphone on from the background. |
| Alarm | None. Airese doesn't wake anyone. |

**The Recording Sleep screen:**

- **Title:** "Recording Sleep", then "Private and smart listening." with an (i) for how recording works *(content to come)*.
- **Banner** (can be closed): "Keep Airese open while you sleep. You can lock your phone now."
- **Listening ring:** moves with the sound around the stop button.
- **Bottom:**
  - **Recording for 02:14**: hours and minutes, with the colon blinking once a second (steady with Reduce Motion).
  - An outlined pill: **Stops by itself after 12 hours**. Screen readers hear the exact time.
  - "Tap to stop when you wake up".

> **To confirm (Engineering):** recording must survive a locked screen and Do Not Disturb, and the 12-hour cap must be checked against battery and storage measurements.

### 5.8 Recording Details

The most important screen: one night's results. Opened after stopping a recording, or from the Recordings list.

#### Page template

- **"‹ Recordings"**, the night's date as the title ("Tue, 6 Oct"), and "8 hr of recording · 11:05 pm to 7:05 am".
- **A sticky footer** with one next step. **Keep tracking** on ordinary nights; **Talk to a sleep care team** only for a repeated pattern (it opens a sheet: "A sleep care team from The Air Station can go through your recent nights with you and suggest what to do next. It isn't a diagnosis." with **Request a callback** · **Not now**). Under it, "Powered by The Air Station".

#### States

| State | When | What the page shows |
| --- | --- | --- |
| Processing | Straight after stopping | "Looking through your night" / "Finding the moments worth showing you." with a soft progress shimmer. No empty cards. |
| Couldn't hear clearly | Poor audio | "We couldn't hear enough clearly last night" / "Try placing your phone closer to your bed tonight." Privacy footer. No scores. |
| First night | No history yet | Proof first: the night in sound comes **before** the scores. No comparisons. "Your first night" note instead of recent nights. |
| Ordinary | Close to usual | "A steadier night". Status mark: Dew check. |
| Unusual | One night out of the ordinary | "More snoring than usual". Status mark: Lamp arrow. |
| Repeated pattern | The same thing on many recent nights | "Worth a closer look". Status mark: Lamp eye. Footer becomes **Talk to a sleep care team**. |

#### Three levels of detail

| Level | For | What |
| --- | --- | --- |
| Glance | Everyone, at 6 am | The verdict and **Have a listen** · Sound Score and breathing pauses |
| Explore | The engaged user | Your night in sound (chart and clips) · snoring and sleep · recent nights · what it means |
| Report | The curious, and doctors | The night report sheet: zoomable chart, every measure, how it's measured |

#### The page, top to bottom (ordinary, unusual and pattern nights)

1. **The verdict card.**
   - A status mark, a headline and a sentence, e.g. "Worth a closer look" / "You snored for 4 hr 57 min, mostly between 12 and 2 am. Your breathing was interrupted often, as on most recent nights."
   - **Have a listen** plays the selected moment.
2. **Two score tiles, side by side.** Each opens a sheet.
   - **Sound Score:** a big ring with the number inside (e.g. 88), a level word (Low, Moderate, High) and the trend ("More than usual", "About usual", "Less than usual").
   - **Breathing pauses:** a ring with an icon, not a number. A plain level word (Rarely, Sometimes, Often) and the trend. The exact rate per hour is only in its sheet and the night report.
3. **Your night in sound.** The chart and the clips in one card.
   - **Opening line,** e.g. "Louder than a conversation for 1h 30m. Mostly between 12 and 2 am."
   - **The chart:**
     - the whole night's sound level as a filled shape, against 40, 60 and 80 dB lines;
     - breathing pauses as purple marks above the plot;
     - the moments you can hear as rings on the axis.
     - Tapping anywhere picks the nearest moment and plays it.
   - **The player:** time, what it is, level and length (e.g. "3:48 am · Breathing pause · 34 dB · 14 sec"), then a waveform. A breathing-pause clip frames the **Pause** (dashed purple) and the **Loud breath** after it (solid orange). Then a scrubber and play/pause.
   - **Navigation:** **‹ 2 of 3 ›** steps through the key moments; **All 12 ›** opens every clip.
   - **Key moments:** three, spread across the night (the loudest snoring, a breathing pause, and one more snoring moment far from both). The player opens on the breathing pause, the clearest proof.
4. **Snoring and Sleep tiles,** side by side.
   - **Snoring:** total time (e.g. "4h 57m"), the trend, and small bars by hour.
   - **Sleep:** estimated sleep (e.g. "7h 46m"), a level ("In range"), and a line with gaps where restless.
5. **Your recent nights:** a bar per night for the last 7, tonight highlighted, a line for your usual, and a sentence ("About your usual 4 hr 17 min of snoring."). On a first night: "Your first night. This gives us a starting point. Record a few more nights and Airese can show you what's typical for you."
6. **What it means.** A warm card whose message follows the ladder (section 7), with an (i) for "How Airese decides what to say".
7. **Night report** card: "Every measure from last night, and how Airese got it. Handy to show a doctor." It previews the loudest level, pauses per hour, and time above 60 dB.
8. **Private by design** footer: "Airese analyses your sleep sounds on your phone. Your recordings stay on your device." Link: "How Airese keeps it private".

#### Sheets ("more")

| Sheet | Contents |
| --- | --- |
| Sound Score | "88 out of 100", the level and guide, what it's made of (loudness out of 50, snoring out of 50, each with a plain line), the guide scale, a plain explanation. |
| Breathing pauses | Pauses an hour (e.g. "15.6 an hour"), how many in how much sleep, the guide scale, pauses by hour, your usual, "it doesn't diagnose anything". |
| Snoring | Total time and share of the night, the full interactive chart, minutes by hour, intensity split (Light, Moderate, Loud, Very loud), a dB reference list (whisper 30, quiet room 40, conversation 60, vacuum cleaner 75), your usual. |
| Sleep | Estimated sleep, asleep and restless line with restless times, the guide scale, how it's estimated. |
| All clips | The night timeline with tappable clip rings, then every clip as a row with play/pause and a plain label. |
| Your recent nights | The 7-night chart, tonight against your usual for snoring, breathing pauses and loudness. |
| Night report | The full interactive chart; a table of every measure (recorded, asleep, snoring, above 60 dB, average, loudest, breathing pauses and rate, coughs, movements, restless, Sound Score and its parts); every score with its guide scale; how Airese measures; "not a diagnosis". |

#### The interactive chart (in sheets and the night report)

- **What it shows:**
  - the sound level every 20 seconds, as one filled shape in the orange loudness ramp (light at the base, deep at the top; never a rainbow, never red);
  - a row of events above the plot, each its own shape: breathing pause (purple pill), cough (white diamond), movement (grey ring);
  - a readout above the chart: the loudest moment in view, or the time and level at the playhead, naming any event there.
- **Touch:**
  - drag to move the playhead;
  - pinch to zoom, down to 2 minutes;
  - two fingers to pan;
  - − / + and **Whole night** do the same with one finger.
- **Screen readers:** a summary, and swipe up or down to step the playhead.

### 5.9 Recordings

The history tab.

- **Header:** "Recordings" and the avatar (opens Profile).
- **One overall insight** on the gradient: a lightbulb, at most two lines, at most one action. It follows the ladder (section 7). Examples:

| Step | Message | Action |
| --- | --- | --- |
| Quiet | Hi Kedar. Your breathing was steady this week. | |
| Getting better | Your breathing was steadier this week than last. | |
| Notice | You snored for 42 min last night, mostly after 3 am. | Have a listen |
| Compare | You snored more than usual on 3 nights this week. | |
| Pattern + suggest | Paused breathing on 5 of 7 nights. Worth seeing a doctor. | Book a callback |
| Help them act | Your report is ready to share with a doctor. | Share report |
| No data | We couldn't hear enough last night. Try your phone closer to the bed. | |
| Building up | Record 3 more nights for your first weekly summary. | |

- **The list:**
  - nights grouped by month, newest first;
  - each row: the date, the night's status mark and headline, and the length ("Worth a closer look · 7 hr 40 min");
  - a row opens Recording Details.
- **Empty:** "No recordings yet" / "Tap the record button on Home at bedtime, and your nights will appear here."
- **Prototype:** the insight changes on every visit so the range can be reviewed. Twelve sample nights over 40 days.

### 5.10 Profile

Account settings, opened from the avatar on Home or Recordings. One short page of rows; anything with a form or switches opens one level down.

| Section | Rows |
| --- | --- |
| You | Initials (no photo), name and email → **Your details**. When empty: "Add your details · Name, email and where you live". |
| Sleep care | **Talk to a sleep care team** (dials; shows hours) · **Our centres ›** ("Find The Air Station near you") |
| Settings | **Notifications ›** ("On · 2 of 3" or "Off") · **Microphone** ("On · needed to record your night", or "Off · Airese can't record without it" with **Turn on**) |
| About | **How Airese works** · **Privacy policy** · **Terms of use** (each in a sheet). Footer: "Airese is not a medical device and doesn't diagnose. Talk to a doctor about any health concerns." |
| Your data | **Delete all recordings** ("12 nights on this phone"; greyed out when none) · **Erase everything and start again** ("Details, recordings, notes and settings"). Footer: "Everything Airese keeps is on this phone." |
| Brand | The Airese logo in muted grey, "Powered by The Air Station", the version. Quiet, at the end. |

**Confirmations.** Both destructive actions confirm first.

| Action | Sheet | After |
| --- | --- | --- |
| Delete all recordings | "Every night's recording and results are removed from this phone. Your details and settings stay. This can't be undone." | A toast: "✓ All recordings deleted". |
| Erase everything | "Your details, recordings, Night Notes and settings are removed from this phone, and Airese starts again from the beginning. This can't be undone." | The app returns to the splash. |

**Your details (page):**

- **Fields:** name, year of birth, email, phone, and where you live (city, state or region, country).
- **Saving:** edits are a draft with a sticky **Save**; Back discards them. Each field is checked when you leave it, and all are checked again on Save.
- **Footer on where you live:** "Kept on this phone. Shared with the sleep care team only if you ask them to call you."

**Notifications (page):** a "Notifications are off" row with **Turn on** while the permission is off, then the three switches (section 5.11). Footer: "To turn off all notifications, use your phone's Settings."

**Our centres (page):**

- **Header:** "The Air Station sleep care team" / "Talk to someone who can go through your recent nights with you and suggest what to do next."
- **One card per centre:** the area, address, hours, **Call** and **Directions**.
- **Then:** "Not sure which centre? Call us…", and the brand footer.

> **To confirm:**
> - the support number, hours and centre details (placeholders in `src/lib/airStation.ts`);
> - the privacy policy and terms (placeholders);
> - what phone and location are for and when they're shared;
> - listing the nearest centre first once real locations exist.

### 5.11 Notifications

| Notification | Default | When | Example |
| --- | --- | --- | --- |
| Tell me when my results are ready | On | When a night's analysis finishes | "Your night is ready. Have a listen." |
| Remind me to stop recording | On | Recording still running at the user's usual wake time (learned from earlier nights) | "Still recording. Stop now to see your night." |
| Remind me to record each night | Off | Around the user's usual bedtime | "Ready to record tonight?" |

- **Permission:** all three need the system permission. While it's off, the switches are greyed out.
- **Wording:** follows the "one finding across channels" rule in BRAND.md. Push stays general ("There's a pattern worth looking at this week"); detail lives in the app.

> **To confirm:** exact copy and timing; how "usual" bedtime and wake time are learned.

---

## 6. Measures and how they're calculated

All ranges below are **placeholders for Clinical to confirm**. Words stay calm: no "bad", no "critical".

| Measure | Definition (prototype) | Levels |
| --- | --- | --- |
| **Sound Score** | 0 to 100, lower is quieter. Two halves: **loudness** (average snoring level; 35 dB scores 0, 65 dB or more scores 50) and **snoring** (share of the night; none scores 0, 40% or more scores 50). | Low (under 40), Moderate (40 to 59), High (60 and over) |
| **Breathing pauses** | Pauses per hour of sleep. A pause is counted when snoring stops for a moment and starts again with a louder breath. | Rarely (under 5), Sometimes (5 to 14.9), Often (15 and over) |
| **Snoring time** | Total minutes Airese heard snoring; also as a share of the recording. | Light (under 10%), Moderate (10 to 25%), High (over 25%) |
| **Loudness** | Average level while snoring and the loudest moment, in dB from the phone's microphone. Phones differ, so compare nights, not numbers. | Quiet (up to 45), Medium (to 55), Loud (over 55) |
| **Above 60 dB** | Minutes louder than a conversation. | |
| **Sleep** | Recording time minus stretches that sounded awake or restless. An estimate from sound alone. | Short (under 7 hr), In range (7 to 9 hr), Long |
| **Rest Score** | How settled the night sounded (sleep length, how often snoring or waking broke it up). 0 to 100, higher is better. In the night report only. | Low, Fair, Good |
| **Coughs, movements** | Counts of each event. | |
| **Usual** | The average of the user's own last nights (7 in the prototype). Never other people. | |
| **Trend** | "More than usual" if over 120% of usual, "Less than usual" if under 80%, else "About usual". | |

**Two numbers that need special care:**

- **Pauses per hour with bands at 5 and 15.** These are the clinical cut-offs for mild and moderate sleep apnoea, so the figure will be read as a diagnosis. That's why the main page shows only a plain word and the exact rate sits one level down. Clinical and regulatory must agree before it's shown at all.
- **dB values.** Uncalibrated phone microphones vary. Show them as relative, and say so.

---

## 7. The escalation ladder

Airese gets more direct only as evidence builds up. **Each step unlocks only when the data supports it; Engineering and Clinical set the thresholds.**

| # | Step | Example | Where it shows |
| --- | --- | --- | --- |
| 1 | Notice | You snored for 42 minutes. | Verdict card, Recordings insight |
| 2 | Compare | That's more than your usual. | Trends, Unusual state |
| 3 | Spot a pattern | 4 of the last 7 nights. | Pattern state, Recordings insight |
| 4 | Explain | Loud, frequent snoring can come with paused breathing. | Sheets, "what it means" |
| 5 | Suggest | Worth mentioning to a doctor. | Pattern state, "what it means" |
| 6 | Help them act | Talk to a sleep care team · Share your report. | Footer button, Recordings insight |

**What it means**, by state:

- **Ordinary:** "Nothing unusual stood out."
- **Unusual:** "Something to keep an eye on… One night alone doesn't show a pattern."
- **Pattern:** "This has been happening regularly… Your breathing was interrupted often on 5 of your last 7 recorded nights. This is worth discussing with a doctor."

---

## 8. Privacy and data

- **Where sound is analysed:** on the phone.
- **Where things are kept:** recordings, clips, details and preferences stay on the device.
- **What is stored:** short clips of the moments that matter, not the whole night. *(To confirm with Engineering: "Only snoring is recorded" must match what's actually stored.)*
- **What the user can delete:** all recordings, or everything (section 5.10).
- **Sharing:** nothing leaves the phone unless the user chooses to share, e.g. asking for a callback or sharing a report (both to design).
- **Wording rule:** privacy is said in one short line, never a wall of text, and never claims more than the architecture does.

---

## 9. Design system and accessibility

Full detail in [BRAND.md](BRAND.md).

| Area | Rule |
| --- | --- |
| Colour | "Night, with one warm light." Midnight background, Deep cards, Moon text, Breath accent, Lamp for the one key highlight. Data colours: Ember for snoring, Iris for breathing, Dew for sleep. Loudness: one orange ramp, light to deep. **Red is for form errors only**, never for sleep data. |
| Type | Montserrat, two weights (regular and semibold). Results use four sizes: 32, 20, 16, 14. Nothing under 12 pt. Big numbers have no small units ("7h 36m"). |
| Icons | Material Symbols (Outlined), through the `Icon` component only. |
| Motion | Two presets only, `slow` and `fast`, each with ease-out, ease-in and ease-in-out curves. No snapping, bouncing or overshoot. Reduce Motion is always respected. |
| Accessibility | WCAG 2.2 AAA: 7:1 text contrast, 44 pt targets, every chart has a text alternative, colour is never the only cue (shapes and words too), every gesture has a one-finger alternative (e.g. zoom buttons for pinch). |
| Templates | DetailPage (sticky back, compact title, optional sticky footer), DataCard (wide and square), LargeSheet (near full-screen), BottomSheet and ExplainSheet (small), grouped forms (iOS Settings style). |

---

## 10. Technical notes for engineering

- **Stack:** Expo SDK 57, React Native, TypeScript, expo-router. Routes in `src/app/`, screens in `src/screens/`, shared parts in `src/components/`, logic in `src/lib/`, tokens in `src/theme/`.
- **No native folders checked in:** `ios/` and `android/` are generated. Configure through `app.json` and config plugins.
- **Sample data (Prototype):** `src/lib/nightDetails.ts` generates each night from its id, so a night always looks the same:
  - the sound level every 20 seconds;
  - snoring stretches and breathing pauses (only during snoring);
  - coughs and movements;
  - clips, with pause and loud-breath marks;
  - scores.

  Replace this with on-device analysis. Every insight needs a confidence threshold and must never turn a low-confidence output into a health statement.
- **Prototype state:** permissions, details, notes and deletions live in a session store (`src/lib/session.ts`). Replace with on-device storage (e.g. SQLite or secure store).
- **Background recording:** must survive a locked screen; foreground service on Android. No scheduled start (platform limits).
- **Permissions:** `expo-audio` (microphone) and `expo-notifications`. The browser preview simulates the system prompts.
- **Data for the interactive chart:** sound level every 20 seconds, plus times of breathing pauses, coughs and movements.
- **Data for clip marks:** for each clip, where in it the pause starts and ends and where the loud breath is.
- **Placeholders to replace:**
  - support and centre details: `src/lib/airStation.ts`;
  - guide ranges: `src/lib/benchmarks.ts`;
  - Sound Score formula: `soundScoreParts` in `src/lib/nightDetails.ts`;
  - privacy policy and terms: `src/screens/ProfileScreen.tsx`.
- **Browser preview:** `preview/index.tsx` mirrors the routes for review; `public/iphone.html` adds the iPhone frame and a "Jump to" menu for every screen and state. It's published to GitHub Pages on every push to `main`.

---

## 11. Success measures

- **Retention:** users record more than one night, and reach three nights (enough for a first comparison).
- **Proof:** the share of morning sessions that play at least one clip.
- **Action:** more users go from a flagged pattern to talking to the sleep care team or sharing a report.
- **Trust:** fewer people turn off notifications or erase everything.
- **First A/B test:** two versions of the "worth getting checked" message.

---

## 12. Decisions and open questions

### Decided (October 2026)

| Decision | Why |
| --- | --- |
| Start now, stop when you wake; 12-hour safety stop; no stop time at bedtime | A stop time is a guess people can't make at bedtime, and stopping too early loses data. The morning stop leads straight to the results. See RECORDING.md. |
| Tap to start (not press and hold) | Simpler. Stopping still confirms, so a stray tap costs nothing. |
| No scheduled start, no alarm | Platform limits; an unreliable alarm would be the worst failure. |
| Verdict first, then scores; on a first night, proof before scores | Belief comes from hearing yourself; scores mean little without a comparison. |
| Chart and clips merged into one card | The chart is the index of what you can hear. |
| Breathing pauses as a plain word on the page, exact rate one level down | The rate reads as a sleep apnoea index; it needs Clinical and regulatory agreement. |
| Three levels: glance, explore, report | Simple for most, detailed for the curious and for doctors. |
| No red; one orange ramp for loudness | Calm, not alarming; colour-blind safe. |
| "Erase everything" instead of "Delete account" | There are no accounts yet. |
| No photo upload | Out of scope. |

### Open

| Question | Owner |
| --- | --- |
| Can a per-hour breathing figure be shown at all, and with which bands? | Clinical, Regulatory |
| Sound Score formula and all guide ranges | Engineering, Clinical |
| How accurate is pause detection (share of flagged pauses that are real, real ones missed)? | Engineering |
| Clips only, or the whole night? (Decides "tap anywhere to hear".) | Engineering, Product |
| Is "Only snoring is recorded" true? | Engineering |
| What are phone and location for, and when are they shared? | Product |
| Callback flow: contact details, consent, what the care team sees | Product, Clinical |
| Sharing or exporting a report for a doctor | Product |
| Partner sharing of a clip | Product, Privacy |
| Notification copy and timing; onboarding copy still says "two a day" | Product |
| Support number, hours, centre details, privacy policy, terms | Easmed, Legal |
| 12-hour cap against battery and storage | Engineering |
| Medical-device position and disclaimer wording | Regulatory, Legal |

---

## 13. Glossary

| Term | Meaning |
| --- | --- |
| Breathing pause | A moment when breathing sounded paused or uneven while snoring, followed by a louder breath. Counted, not diagnosed. |
| Clip | A short recording of a moment worth hearing (loud snoring, steady snoring, a breathing pause). |
| Key moments | The three clips the page leads with, spread across the night. |
| Night report | The sheet with every measure and how it's measured; for the curious and for doctors. |
| Night Notes | What may affect tonight's sleep (feeling, before bed, somewhere different, remedies). |
| Sound Score | 0 to 100 summary of how loud and how much the user snored. Lower is quieter. |
| Sleep care team | The Air Station's team that can go through recent nights and suggest a next step. |
| The Air Station | Easmed's sleep care service; "Powered by The Air Station". |
| Usual | The user's own recent average. Never other people. |
| Escalation ladder | The six steps from noticing to helping the user act, each unlocked by evidence. |
