# Test fixture — fake work-log monologue

**Loom:** (fixture — no real recording)
**Recorded:** 2026-04-18, ~17 min

---

[00:00] Okay, recording. Weekly log, Friday the 18th. Let me just talk through
what I worked on this week, roughly in order.

[00:12] The big thing — and I want to come back to this because I'm still
processing it — is the eval stuff. So a couple weeks ago we noticed our
dashboards were showing recall of 1.0 on the retrieval step for our support
agent. Like literally, every query was hitting the right chunk. And yet, at
the same time, we had three customers open tickets saying the agent was
giving wrong answers. Both things could not be true at the same time, and it
took me way longer than it should have to figure out why.

[01:45] What I eventually worked out is this: chunk-level recall just tells
you whether the "right chunk" was in the retrieved set. But it says nothing
about whether the actual answer — the specific character span the user needs
— is a meaningful portion of that chunk. So we had chunks that were like
800 tokens long, and the useful answer span was maybe 60 tokens of that.
Span-level recall in that case is like 0.075, not 1.0. The dashboard was
lying to us. Or we were lying to ourselves, depending how you look at it.

[03:10] I spent most of Tuesday and Wednesday rebuilding the eval to score
span-level overlap. It's honestly not complicated — it's just character-level
set intersection — but what was interesting is that once we ran the whole
test set through the new scorer, our "93% recall" system dropped to 41%
span-level recall. And that 41% number actually matched what customers were
telling us. It's the honest number.

[04:30] I think this is something more people in CX should know about.
Every vendor in this space quotes chunk-level retrieval numbers in their
pitch decks and it's effectively a vanity metric. If someone's evaluating
a support-agent product, they need to know to ask for span-level recall
specifically. Otherwise they're buying on a number that doesn't correlate
with what their users experience. Like, that's the whole thing — the thing
you're measuring is whether the customer gets their answer, not whether your
retriever found a document with the answer somewhere in it.

[06:00] Anyway. The other big thing was — related but different — we started
noticing our agent's answer quality was degrading over time. Not a huge
amount. Like, maybe a 3-5% drop in our internal quality score over a month.
And this is with the same model, same prompt template, same retrieval
system. Nothing had changed, allegedly. Except something had changed,
obviously, because the numbers were dropping.

[07:20] So I set up this thing — I'm calling it a canary suite — where we
run the same 50 representative queries through the agent every morning and
diff the responses against the previous day's baseline. What I found is
pretty funny actually. The "nothing had changed" was wrong. Our knowledge
base grew by like 12% in that month. New documents were added. And as the
index grew, the retriever started picking up these slightly-less-relevant
chunks that were semantically close enough to pass the retrieval threshold
but were actually pulling the generation off-topic.

[09:05] The insight for me was: a stable model doesn't guarantee a stable
agent. The corpus is part of the system. And you only catch this drift if
you run deterministic evals continuously — not just when you ship a model
change. I think this is a really under-discussed problem in applied LLM
systems. Everyone tests on fixed datasets when they deploy; almost nobody
runs the same test every day.

[10:40] Other things this week — this is just housekeeping. We bumped our
dependency versions across the backend. Pretty standard. Pydantic 2.4
something, some FastAPI patches. Nothing exciting. Took me about half a
morning.

[11:10] Also fixed a flaky test in the ingest pipeline. It was failing
maybe one in twelve runs because of a race condition in how we were polling
for the embeddings to complete. Added a proper await. Yeah, nothing to see
there.

[11:50] Had a 1:1 with Priya about Q2 priorities on Thursday. We talked
about the roadmap, the new enterprise deal, the hiring plan. Good
conversation. Nothing video-worthy obviously — it's internal.

[12:45] Oh, one more thing that's maybe interesting, maybe not. We ran a
POC with a mid-market CX team this week. They were trying our agent
against their existing system. The results were — honestly — mixed. On
simple FAQ questions we won clearly. On more nuanced multi-turn
conversations, we were roughly tied. On cases where the user was asking
something that required combining info from multiple docs, they actually
beat us. I don't know yet if there's a video in that. It feels like the
lesson might be about demo-design — like, we need to be clearer with
prospects about where LLM agents genuinely outperform traditional systems
and where they don't. But I want to sit with it a bit longer before I know
if this is a public-facing lesson or an internal one.

[15:30] That's the week. The two things I want to come back to and
possibly make content about are the chunk-vs-span thing and the canary
suite thing. Both of those feel like they got me genuinely surprised, and
I think other people in this space are making the same mistakes I was.
Okay, recording ending.
