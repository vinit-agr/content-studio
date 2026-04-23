# Video ideas — dataset generation in the CX Agents Repo (2026-04-23)

**Source:** `content-source/2026-04-23-cx-agent-quick-demo/source.md` — Loom (private, two-part recording) · ~35 min / 5965 words
**Project:** `projects/cx-agent-evals--chunk-vs-span`
**Generated:** 2026-04-23 by /video-ideation
**Count:** 8 (adaptive default, >4,500 words — hard cap)

---

## 1. Why I evaluate retrieval at the token level, not the chunk level

**Scores:** overall **8.5** · builder 8 · youtube 8 · cx 10

- *Alt:* Chunk-level recall is an industry habit — here's the upgrade
- *Alt:* Your RAG ground truth should be character spans, not chunks

**Hook (0–15s):** The industry evaluates retrieval at the chunk level. I think that's a habit worth breaking. Here's what I built instead — and why character-span ground truth is the only honest measure.

**Builder narrative:**
- **Setup:** Standard retrieval evals score "did the retriever return the right chunk?" — chunk-level recall.
- **Surprise:** Chunks are too coarse. The real ground truth is the character span inside the document — the exact tokens the answer lives in. Anything wider is noise.
- **Takeaway:** Built the eval system around per-question character-span ground truth. Retrievers now get scored on token-level overlap with that span, not on whether the right chunk was in the bag.

**Source evidence:**
> "these spans are basically ground truth. This is what we want, ideally, that we were to give as chunks, right? So, this is the ideal thing. If they give it exactly these things, these characters or these tokens, that means they are the most accurate, right? They are 100% accurate. And, this is basically a token level comparison or evaluation, you can say, essentially, right? So, instead of a chunk level evaluation, which is very common in the industry right" — @ 15:03

> "this is the, very clearly, makes more sense because it's much more granular and you can compare it. Check exactly token level, uhm, relevance, right?" — @ 15:29

**Who cares:** CX engineers or ops leads who've shipped a retrieval system, see "good" chunk-level recall, and suspect their users aren't getting the answers the dashboard claims.

**Takeaway:** Move ground truth from chunks to character spans and the whole eval stops lying to you.

**Format hint:** talking-head

**Risk:** The transcript has the concept but not the "dashboard lied to me" narrative arc — the crisp version will need a sharper hook built around a specific moment of surprise, not a generic explainer.

---

## 2. Your best LLM eval questions are already in your live-chat logs

**Scores:** overall **8.3** · builder 8 · youtube 8 · cx 9

- *Alt:* Real-world questions beat synthetic ones — here's why I mine chat transcripts first
- *Alt:* Stop generating eval questions. Start harvesting them.

**Hook (0–15s):** Everyone generating RAG eval questions with LLMs is starting one level too late. Your actual user questions — with typos, fragments, weird phrasing — are already sitting in your live-chat logs. Here's why those beat anything you can synthesize.

**Builder narrative:**
- **Setup:** Teams building retrieval evals default to synthetic Q generation: ask an LLM to produce 50 diverse questions against the docs.
- **Surprise:** Synthetic questions read like a polished essay; real users write in cryptic fragments. The shapes don't match, so you end up testing the wrong distribution.
- **Takeaway:** Start by mining real user questions from your live-chat transcripts. Synthetic generation is for filling diversity gaps AFTER — not for the primary tier.

**Source evidence:**
> "but that's how users will say things, right? They will just say stuff, uhm, that, uh, you have to be prepared for. That's why real-world questions, grounding is the most important one, and you should really try to get real-world questions. Because that will just improve the quality of your dataset." — @ 26:02

> "ideally, you would want to, like, go through the conversation and extract the specific questions that the user has asked, which, essentially, you want to test against, right? So, basically, these are, like, uh, uhm, which are, like, factual kind of questions, not factual questions, but, basically, it requires a knowledge retrieval, essentially, right? You have to handpick those, or you can, basically, have a system which will extract it automatically." — @ 17:40

**Who cares:** An LLM engineer or CX-ops lead about to deploy a RAG-backed agent who spent a week carefully generating synthetic evals — and hasn't sanity-checked whether those questions match what users actually type.

**Takeaway:** Your live-chat history is a free, higher-quality eval corpus than any synthetic generation will give you.

**Format hint:** talking-head

**Risk:** Teams pre-launch or with no chat history can't apply this directly — the video has to acknowledge that and still land with a useful "what to do instead" for greenfield cases.

---

## 3. Dimension-driven synthetic Q generation for RAG evals

**Scores:** overall **8.2** · builder 9 · youtube 7 · cx 8

- *Alt:* How I generate genuinely diverse eval questions (without "make it varied please")
- *Alt:* UserPersona × QueryIntent × Complexity — combinatorial prompting for better synthetic evals

**Hook (0–15s):** Asking an LLM to "generate 50 diverse questions" gets you 50 questions that all sound the same. I built synthetic generation as a combinatorial problem over explicit dimensions. Here's what changed.

**Builder narrative:**
- **Setup:** Synthetic Q generation usually reduces to "please generate N varied questions." Output is mushy and narrow.
- **Surprise:** Diversity is a combinatorial problem, not a prompt problem. Define dimensions (user persona × query intent × complexity × product area), enumerate valid combinations, and prune the impossible ones (NewUser × AdvancedQuery).
- **Takeaway:** Each valid combination becomes a seed — and the output covers the user space in a way "make it diverse" never will.

**Source evidence:**
> "it has UserPersona as NewUser and PowerUser. So, ah, if I'm making an internal sub-customer support chatbot, so, there'll be two type of people will be there. Ah, I can have more personas with them. So, it will take a, for example, NewUser, and then it will take, ah, QueryIntent to be maybe integration help, right, and then QueryComplexity will take basic, right, because NewUser with advanced query, ah," — @ 20:19

> "will be, you know, less likely. So, it will probably remove those combination. it doesn't make sense." — @ 20:44

> "this, basically, uh, configuration does, which is dimension-driven, we call it. Basically, we create different dimensions, create a value to it, and it figures out different problems. You can add more dimensions to it, right?" — @ 22:01

**Who cares:** Engineers building eval datasets who are frustrated that "generate diverse questions" keeps returning near-duplicates.

**Takeaway:** Enumerate dimension combinations instead of asking for diversity.

**Format hint:** hybrid (a visual grid of dimension × dimension landing combos would add a lot)

**Risk:** Niche-flavored — non-LLM-builders will bounce unless the hook opens on the "diverse questions please" frustration everyone has felt.

---

## 4. Your RAG eval dataset is secretly a cache

**Scores:** overall **7.8** · builder 8 · youtube 8 · cx 7

- *Alt:* The two-for-one: gold eval sets can serve traffic, not just score retrievers
- *Alt:* Use your eval dataset as a semantic cache

**Hook (0–15s):** You spent three weeks building a hand-verified gold eval dataset. It sits in your repo and runs once a sprint. What if the same dataset could also serve production traffic?

**Builder narrative:**
- **Setup:** Teams build golden eval datasets — human-verified Q+span pairs — and use them exclusively for benchmarking retrievers.
- **Surprise:** The same dataset can double as a semantic cache. Incoming user query → fuzzy-match against gold questions → if ≥ 90% similar, return the hand-verified span directly without hitting the retriever.
- **Takeaway:** Your eval set is the highest-quality data in your system. Use it twice — for scoring AND for serving.

**Source evidence:**
> "50 questions or 100 questions, ideally more, depending on your question dataset. And spend time on building this dataset so that you can really evaluate how the system is working, how only that system is working. And you can also use this dataset as a caching mechanism as well maybe" — @ 12:49

> "So, if somebody asks a question, you can use that as a question, and it tries to match it against these 100 tests, the question that I said you have, you have, like, manually created. If it matches 20 of them with, uh, let's say, 90% accuracy, something like that, then, uhm, it basically picks the same answer but, you know, the exact down-to-earth, essentially, character span that you've configured manually." — @ 13:18

**Who cares:** LLM-ops engineers justifying the cost of building a gold eval set — a second ROI angle (production latency + cost) makes that easier to fund.

**Takeaway:** The gold eval set can do double duty as a semantic-match cache in production.

**Format hint:** talking-head

**Risk:** Cache invalidation on doc changes isn't addressed in the transcript — a thoughtful viewer will ask about staleness, and the video needs an answer.

---

## 5. I raced 7 retrievers against one gold dataset — here are the numbers

**Scores:** overall **7.2** · builder 8 · youtube 6 · cx 7

- *Alt:* BM25 re-ranked beat every dense retriever in my eval. Here's the catch.
- *Alt:* Head-to-head retriever bake-off on my own data

**Hook (0–15s):** Everyone debates which retrieval strategy is best — BM25, dense, hybrid, re-rank. I built the harness to actually race them on the same gold questions. The winner surprised me. The winning NUMBER surprised me more.

**Builder narrative:**
- **Setup:** Seven retrievers — BM25, dense, hybrid variants, each with their own config — indexed the same small KB and scored against the same 14-question gold set.
- **Surprise:** BM25 re-ranked came out on top. And its recall was only 21.5%. Honest number, but also a wake-up call about the corpus.
- **Takeaway:** The ranking tells you which retriever wins. The absolute score tells you whether the corpus can even support the questions you're asking.

**Source evidence:**
> "each of the questions here that you have seen, like for this 14 questions data set, it has a, uh, ground truth. These are the characteristics, but it has a ground truth, which is the actual correct value for it, right? So in the retrievers experiment, you can see what it is doing is it is, uh, using this retriever, the OpenCLOS style retriever, which has some configuration of its own, it will, this is it." — @ 30:30

> "So now you can see it has completed it, and it found that this BM25 rank, re-ranked, is the best retriever, which has 21.5% recall, which is not that great. So this definitely requires," — @ 33:19

**Who cares:** CX or LLM engineer debating hybrid vs. dense-only retrieval and wondering whether the abstract tradeoff posts on Twitter map to their actual KB.

**Takeaway:** Race your retrievers on YOUR data. The winner is often unglamorous and the absolute recall often tells you your KB is the problem.

**Format hint:** hybrid (results table + talking-head narration lands better than pure talking)

**Risk:** 21.5% recall is a low number that could read as "this whole RAG approach is broken" if not framed as a KB-size issue up front.

---

## 6. When your RAG recall is 21%, don't blame the retriever

**Scores:** overall **7.0** · builder 7 · youtube 7 · cx 7

- *Alt:* Low recall usually means your knowledge base is missing content — not that your retriever is broken
- *Alt:* Before tuning retrieval, ask: is the answer even in the corpus?

**Hook (0–15s):** Your RAG eval is returning 21% recall. Everyone's first instinct is to tune the retriever — swap BM25 for dense, re-rank, chunk smaller. Stop. The retriever is probably fine.

**Builder narrative:**
- **Setup:** Retriever eval comes back with a low recall number.
- **Surprise:** Reflex is to tune the retriever. But often the ground truth just isn't in the documents — the KB is too thin. No retrieval algorithm can find content that doesn't exist.
- **Takeaway:** Audit corpus coverage before tweaking retrieval config. Add the missing docs first; chase algorithm gains second.

**Source evidence:**
> "uhm, like, improvement on the KB side of things, because I think KB is missing a lot of documents, because it's a very small document. But if I have a bigger KB with a lot of documents, I think it should work" — @ 33:44

> "because, uh, you can ask a new question completely, you know, which it has no idea, but if you have made a really good diverse question dataset, then it will, uh, basically get very close to serving most of the users, essentially, right?" — @ 33:19

**Who cares:** Engineer staring at bad retrieval numbers trying to decide which lever to pull first — retriever config, chunk size, re-ranking, or something else entirely.

**Takeaway:** Low retrieval recall is often a missing-content problem, not a missing-algorithm problem.

**Format hint:** talking-head

**Risk:** Specific to RAG systems with a controllable KB — doesn't apply to open-web retrieval, needs to scope clearly.

---

## 7. There is no universal retriever — why every KB needs its own eval

**Scores:** overall **7.0** · builder 7 · youtube 6 · cx 8

- *Alt:* Skip the retriever-of-the-month cycle — run your own eval
- *Alt:* Retriever selection is a per-dataset decision, not a universal one

**Hook (0–15s):** Everyone's hunting for "the best retriever." It doesn't exist. Here's what actually determines retrieval quality: the shape of your own data. And why that means you can't skip building your own eval.

**Builder narrative:**
- **Setup:** The retrieval landscape ships a new "best" every month — BM25, dense, hybrid, GraphRAG, late-interaction, etc.
- **Surprise:** Each strategy wins on different data shapes. Finance docs (SEC filings + spreadsheets + annual reports) behave differently from a support KB. No single retriever tops every corpus.
- **Takeaway:** Stop hunting for the universal winner. Accept that retriever selection is a per-dataset decision — and build the eval harness to make that decision repeatable.

**Source evidence:**
> "there's always going to be, maybe there's a technique which comes and which works really well, and, uh, there's no need for all this system. We just use that. Maybe that will happen, uh, and that, that will be great, but until that does not happen, we have to have this evaluation system." — @ 06:40

> "for example, within, let's say, um, finance company, we have documents like, uh, SEC filings. You will have, uh, financial, uh, sheets, right, uh, spreadsheets, and you will have, uh, documents, reports, annual reports, those kind of stuff, right? So, all of them have very different kind of, uh, like data format, and, uh, ideally, we would want, uh, to be able to read all of those things, so that's something, you know, we are building these retrievers for," — @ 07:06

**Who cares:** Engineer reading yet another "X beats Y" retrieval benchmark and wondering if they need to migrate their stack again.

**Takeaway:** There is no universal retriever — build your eval once, run it whenever a new option shows up.

**Format hint:** talking-head

**Risk:** Can read as "evals are important" (yawn) unless the hook lands on the specific exhaustion with the retriever-of-the-month treadmill.

---

## 8. The workflow: mining live-chat transcripts into a real-world eval set

**Scores:** overall **6.5** · builder 6 · youtube 6 · cx 8

- *Alt:* From live-chat logs to gold eval questions — the concrete extraction pipeline
- *Alt:* How I turn actual user messages into retrieval test cases

**Hook (0–15s):** So you agree real-world questions beat synthetic ones. Cool — now HOW do you actually get them out of your live-chat history? Here's the extraction workflow, hand-pick step included, and where I'd automate next.

**Builder narrative:**
- **Setup:** You have months of live-chat or call transcripts and a gut feeling that the best eval questions are buried in there.
- **Surprise:** You don't need an automated extractor to start — hand-picking a batch of 20–30 real user messages from last week's transcripts gets you 80% of the value, today.
- **Takeaway:** Extract manually first, automate second. The filter-for-knowledge-retrieval-shaped-questions step is the hard part; keep a human in the loop for that until you have enough data to train a classifier.

**Source evidence:**
> "first configuration is the real-time So, these are something that you will extract typically from your human live chat, uh, agent, uh, conversation transcripts," — @ 16:21

> "for that, something I have been doing, extract this kind of intel from the live chat transcript, uhm, but, maybe, initially, you can just do it handpicked, you know, by self. Again, I just copied it, right now, from our own live chat, that we have sitting on our website." — @ 18:07

**Who cares:** CX engineer convinced by idea #2 (real > synthetic) and now asking the practical question: "OK but what does the extraction actually look like on Monday morning?"

**Takeaway:** Start with 20-30 hand-picked questions from last week's chats; automate only once you've seen the pattern.

**Format hint:** hybrid (screen-share of an actual chat transcript + highlighting what's a good extract candidate)

**Risk:** Overlaps heavily with idea #2 — if both get made, this one should be positioned as the "how-to companion" so they're not mistaken for the same video.
