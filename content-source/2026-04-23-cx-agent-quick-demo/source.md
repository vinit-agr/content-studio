# Dataset generation in the CX Agents Repo

**Source:** Loom (private, two-part recording)
**Duration:** ~35 min (2 parts)
**Generated:** 2026-04-23 by tools/transcripts/srt-to-source.ts

---

[00:00] Hey, everyone. So, I want to talk about, uh, how I'm making the, uhm, an evaluation system. And, basically, a CX agent builder and evaluation system, basically, right? And, uhm, as part of this whole journey, today,

[00:25] I want to talk about how can I generate a really good dataset against which I can evaluate. Or test my CX agent that I want to deploy for my customers, which are basically businesses in, uh, B2C domain, primarily, but it can be more than that as well, right? So, as part of that, uhm, so if you, just a quick background for that. Good context. We, uh, basically have, uh,

[00:52] by CX agent I mean is like something which is, uh, sitting on your website on your, uh, as a widget, uh, on your, uh, for example, here, this is our website and, uh, you can click on this and, uh, it sits like a chat widget where you can say, hey, uh, tell me about your

[01:20] company, TARS. So, uh, it'll just respond to me, uh, tell me about the company and, uh, obviously, TARS is a delivery service. We're known for delivering high, highly personalized, result-driven AI agent that automate conversations and boost engagements. So, yeah, that is what we do. We basically,

[01:46] uh, make these, uh, AI agents, which are basically sitting on your website as a widget or on your, uh, uhm, WhatsApp number, on your email. So, it's like a CX solution. It's like pretty much typical CX solution, nothing super fancy there, uh, but very, uh, important problem. Uhm,

[02:11] so, in this one, I'm going to, so you need to have an agent which will basically answer to users' questions and basically help them with whatever they want, right? So, very broadly speaking, uhm, basically, the kind of customers that will come there, especially, either in the, uh, pre-sale stage, they, the, the agent is supposed to basically help them, you know, understand the product and do, you know, some kind of, you know, sales, sales or selling, or, you know, consultative selling and if they're

[02:39] already a customer, uh, then it will basically help them, you know, in terms of support and, uh, understanding what they want and helping them and, uh, maybe, uh, if, uh, if, uh, configured, it can be in the expansion mode as well, where, uh, it will try to up-sell and cross-sell, those kind of stuff, right? But anyway, that's what it Whatever it is doing, it's basically interacting with the customer to help them answer questions or to do things on their behalf. So, this is a very broad level of

[03:05] two things, which, uh, I'm just putting in, this is what basically the CX agents do essentially for the CX use cases, basically. Customer experience use case, which is customer support or customer sales, right? Um, online sales or digital sales kind of, uh, channel, right? So, um, so as part of this thing, whenever there's an interaction happening, there's either customers asking a question or they're asking for some request to

[03:33] take some action. For example, uh, help them book a meeting or send an email or create a ticket or, uh, uh, file a complaint or make a sale. You know, purchase something or whatever, right? So these are all things like actions that they want to get done on their behalf. But the other aspect is they want to understand about how the product works, uh, what is the pricing looks like, and, uh, how can, uh, they use it, do they have this feature,

[03:59] you know, or how do you solve it. So they have a lot of questions about, uhm, in the pre-sales stage and after that, how, uh, I'm having issues with this particular feature, you know, how can I fix it, or, do we have this feature, I cannot find it, right, or I I don't know how to do it, right, or maybe I maybe, uhm, uh, can I, you know, add more team members, uh, and do we have a team plan, something like that, I want to upgrade, you know, those kind of things. Uh,

[04:25] basically, any of those things will be a mix of two of these atomic tasks, you know, in my head, uh, to keep things simple, which is one, to either ask questions or take some actions, right? So, as part of the first thing, which is to ask questions and get a really good response and, and, uh, very, uhm, detailed and very, uh, uhm, uh, helpful response. So in that case, uhm, uh,

[04:52] the most important tool or most important thing is basically knowledge retrieval and, and basically that's what, uh, that's why in my oral, overall CX agent system, I'm much more focused or I'm, I'm, I'm, I'm focusing a lot right now and as part of this development journey to on retrievers essentially, right? So retriever is basically something like where you give it a bunch of documents, which are the KB that has six documents, it has other documents. So as you get a different different,

[05:20] uh, uh, knowledge bases, for each of the knowledge base, you can create different kind of retrievers. And, uh, so again, I'll not go into this in detail, but basically you can create all the configuration about how it works. How it is indexed, or how you can query it, uh, you know, and different approaches and different rag, these are basically different rag approaches, but, uh, it has some other, uh, kind of text, um, basically full text search as well as VN25,

[05:48] right, you can have hybrid search, and for each of them you can set the corresponding password. And you can also add refinement to do re-ranking, threshold-based, uh, refinement, deduplication, so there are different techniques, you know, that you can use to do refinement, and then finally you can query it. create this retriever, so this is very customisable retrievalment system, so again, I'll, uh,

[06:15] not go too deep into this thing, in this, uh, call, or in this video. So, I'll come back to her. Um, dataset generation and, so, it's part of figuring out what is a good retrieval, and, uh, for a dataset and in general, and how does it work. So, we need to evaluate the retrieval, and retrieval evaluation is something very important, and, uh, I don't think it's going to influence to be,

[06:40] uh, I mean, there's always going to be, maybe there's a technique which comes and which works really well, and, uh, there's no need for all this system. We just use that. Maybe that will happen, uh, and that, that will be great, but until that does not happen, we have to have this evaluation system. You can try a lot of things, right, and especially when you are working in a very diverse set of data set, uh, within the one organization itself, right, and definitely across different industries.

[07:06] So, for example, within, let's say, um, finance company, we have documents like, uh, SEC filings. You will have, uh, financial, uh, sheets, right, uh, spreadsheets, and you will have, uh, documents, reports, annual reports, those kind of stuff, right? So, all of them have very different kind of, uh, like data format, and, uh, ideally, we would want, uh, to be able to read all of those things, so that's something, you know, we are building these retrievers for,

[07:32] and knowledge base section for, so again, I'm not going to do that. So, uh, but the important thing is that across all of these things, you need to be able to evaluate which one is working well for your use case for your dataset, right? So, for that, I have built this evaluation system, retriever evaluation system, and for retrieval evaluation, I need a dataset against which to do evaluation, and this basically is a dataset, uh,

[07:59] this video is about how that dataset I am building and, uh, how is it, uh, going to help, right? So, cough cough cough hmm jar boards are great! So these are, basically, what I have done is, I have given it,

[08:26] uh, it starts with the Knowledge base, so I, I have taken, I a small list. I have a list of six documents, so that we can, uh, uh, review it much more easily, but you can do it for larger documents as well, it's just going to take some time, we are going to process all of that. So I have been working with six documents here, these are mostly our own internal, like, uh, internal docs, so I just kept a small number of documents, so I made a small corpus, and I have,

[08:53] uh, so I can create a new generation like this, uh, so this is an existing dataset, you know, with 48 questions, so, uhm, I'll come back to the generation, but it'll be me show you quickly what it is. So, what happens is, within this, uh, uh, generation, I need to create, this is a 48 questions, you know, were, were generated, and there were 6 documents, so what it does is that it goes to each of these documents,

[09:18] and, uhm, and tries to, basically generates a, a question, which we would want to evaluate against, for example, these questions are basically user questions, so, this is one example is how to make the live chat come to my task conversations, right, this is actually user questions, I'll again, go to this new generation I'll talk about, ah, basically here you can add, ahem, as part of new generation you can add some sample questions,

[09:44] right, and you can add as many as you want, you can even upload a CSV, and, it will, will try to find the right match, or the right, ah, uhm, uhm, you can say text snippet out of all the documents in the KB. And it tries to find that, and tries to, basically, uhm,

[10:13] like, associate with that, like, saves it, you know, for that question. And it does that for, for, uhm, all these questions, essentially, right? And if it finds a match, then it will just use this, uhm, this question as it is, and keeps that match as well. So that match is, basically, this span, you can say, right? You can see this has four spans. Four span, basically means it's a character span. So, basically, out of this one document, it has, if you have seen the question, how to make LiveChat compliment all

[10:39] these chatbots. Chatbots are great, but let's face it, they sometimes need human help to deal with this, to address this. We build a Zendesk LiveChat integration that lets your chatbot seamlessly hand off conversation to an agent when user requests it. In this article, we'll cover how to, so this is the part about how our Zendesk LiveChat system works. And, uh, to input these fields, first add, gambit, collect, this, this,

[11:05] this, right? So, you can see, basically it is highlighting the character space. the answer to this question lies, right? So, now it's trying to make a, like a, intelligent guess, but it might not be accurate. And that is why we need a, uh, uh, in the next version of it, I will be making an edit option, where I can edit the, uh, uh, uh,

[11:31] question here and can even edit the span here. And, uh, right now it has access to, it basically gives the span from one document only, but in the future I want to have, where it can give span from multiple documents because if you think about it, this question's answer can belong to multiple documents because LiveChat is a very big feature of our product and it can have a lot of other information,

[11:56] right? So, uh, So, we should have a capability to find all of those things, those options, in a more liberal manner and then allow the user to be able to trim down. I think that will be a good interface. Again, these are like, feature ideas. Make this process easy. Basically, the whole idea behind this, making this dataset, and ideally you want to make a golden dataset of maybe

[12:22] 50 questions or 100 questions, ideally more, depending on your question dataset. And spend time on building this dataset so that you can really evaluate how the system is working, how only that system is working. And you can also use this dataset as a caching mechanism as well maybe, so that if you have made these 100 questions,

[12:49] right, corresponding, uhm, character span in the documents, and those are like gold dataset, and you know, okay, those are accurate, and it will only change if the documents' content change, uhm. So, again, there will be other stuff there as well to be looked at, but, uhm, uhm, so you can use that as a caching layer as well.

[13:18] So, if somebody asks a question, you can use that as a question, and it tries to match it against these 100 tests, the question that I said you have, you have, like, manually created. If it matches 20 of them with, uh, let's say, 90% accuracy, something like that, then, uhm, it basically picks the same answer but, you know, the exact down-to-earth, essentially, character span that you've configured manually. So that way, it's, uh, like, it's very, uh,

[13:46] I mean, it can increase the, uh, uhm, the accuracy of the test retrieval. Much more dramatically, because now you have a mechanism to improve it as you see problems, so that in the future it's, it's resolved, or even the past as well, it can be resolved as well, if it's not accurate, and you can even go back to the system and, uh, to the user and, and make a correction, here this AI thing was not,

[14:11] not correct, I verified it and this is the most correct answer. So, and you can do that manually, possibly as well, right? And that will be good. So, uhm, so let's take this part one and continue on the part two. So, let's continue. So, uhm, so if by, uh, you have questions and you have ground truth,

[14:38] essentially, right? And, you have, uh, ground truth basically, right? By ground truth, I mean, this character spans within a document, right? Again, there can be things to improve it, but right now, for one question, you have character span from exactly one document, not multiple documents. And, at least, one span will be there, right? So, no question without a span, because otherwise, it is no way to test it,

[15:03] right? And, these spans are basically ground truth. This is what we want, ideally, that we were to give as chunks, right? So, this is the ideal thing. If they give it exactly these things, these characters or these tokens, that means they are the most accurate, right? They are 100% accurate. And, this is basically a token level comparison or evaluation, you can say, essentially, right? So, instead of a chunk level evaluation, which is very common in the industry right

[15:29] now, but this is the, very clearly, makes more sense because it's much more granular and you can compare it. Check exactly token level, uhm, relevance, right? So, uhm, once we have this dataset,

[15:54] which is a question, which is a user question, and corresponding retrieved character spans, essentially, uhm, then that is the ground truth, this is the ideal character span that should be returned as part of the retrieval, knowledge retrieval. This is the tool, essentially, which will be used by CX agent, right? So, uhm, so that way we can test different, different retrieval, so, uhm, in different configuration and see which

[16:21] one is giving us the correct a really good result, essentially, right? So, example, uh, so this happens. So, again, yeah, this is, so, this video is about basically how to generate this. So, the way I'll just quickly talk about how it works. So, first configuration is the real-time So, these are something that you will extract typically from your human live chat, uh, agent, uh, conversation transcripts,

[16:46] right? So, either in chat conversations or maybe if you have calls, then you call transcripts, right? Uh, so, at the chat, live chat, uh, human live chat, uh, conversation transcripts or the call transcripts. Yeah, that's mostly that we do there, right? So, from those, those are mostly conversations and even that is something, uh, we have made in a, made in a, knowledge base, which is to analyze conversations.

[17:14] So, I'll not show this data right now. Again, I'll not go into this because it's, uh, customer's data. So, uhm, but I think it'll be good. to show it in a different video. But basically, again, not going into that detail right now. But basically, this, uh, first configuration is about rear-wall questions. And these are basically single questions that the user has asked in the course

[17:40] of the conversation, right? So, it's not, uh, So, ideally, you would want to, like, go through the conversation and extract the specific questions that the user has asked, which, essentially, you want to test against, right? So, basically, these are, like, uh, uhm, which are, like, factual kind of questions, not factual questions, but, basically, it requires a knowledge retrieval, essentially, right? You have to handpick those, or you can, basically, have a system which will extract it automatically.

[18:07] So, for that, something I have been doing, extract this kind of intel from the live chat transcript, uhm, but, maybe, initially, you can just do it handpicked, you know, by self. Again, I just copied it, right now, from our own live chat, that we have sitting on our website. So, uhm, but, uh, not on the website, but on the product page internally, this is internal. So, I have 30 questions here,

[18:33] and the idea here is that, uhm, if you, uh, have, uh, these questions. I think I mentioned already that you can have a. You should try to find the answers, or the, or the basic character spans from the KB documents, and if it can find it, it will use it. Otherwise, the rest of the questions, it will not add in the dataset that is, it is supposed to create, So, let's say I have 30,

[19:01] and I think, I've already generated this. You can see there are 25, I can generate again, but I'll do the rest of the conditions, then I'll generate. So, out of those 30, 20, it was able to find 25, uh, character spans, obviously, in the other, other documents, so, and each of those documents, uhm, questions, it has tagged as real world. So, these are, basically, it takes the questions exactly as it is,

[19:26] right, uhm, if it can find the maps. For the rest of it, if it cannot find, it will skip it. So, it is, it will skip that five questions. But even after that, it still only generates 25 questions. I asked it to generate, actually, 50 questions. Sometimes, it was not able to find the character span. So, it, basically, removes those questions. So, that's why it has generated 48. I have to fix it. So, it always generates 50 questions. I have to put some extra return mechanisms there.

[19:53] But I asked it to generate 50 questions. Right now, it generates 25. It still has to generate 23 questions right now. So, for that, it uses the next dimension, which is, ah, where you can add a dimension. Ah, for different combination of corresponding value for, ah, like, generating these questions in a, in a, ah,

[20:19] like, synthetic manner. So, basically, what it will do, here you can see, it has UserPersona as NewUser and PowerUser. So, ah, if I'm making an internal sub-customer support chatbot, so, there'll be two type of people will be there. Ah, I can have more personas with them. So, it will take a, for example, NewUser, and then it will take, ah, QueryIntent to be maybe integration help, right, and then QueryComplexity will take basic, right, because NewUser with advanced query, ah,

[20:44] will be, you know, less likely. So, it will probably remove those combination. it doesn't make sense. It doesn't have something which doesn't make sense. Ah, maybe in one of these languages or whom, and then, ah, product area, you know, some, something to may be late to analytics or something and it

[21:10] will give all this information and basically it will have something like a prompt. It will say something like, hey, this is a document which has a lot of this information, whatever, function read through it. I want you to create maybe two questions based on these different combinations, you can pick whatever, combination of different,

[21:36] you know, criteria like user-persona, query intent, complexity level. So, I want you to create questions from these different combinations, these two combinations which I am giving you, and, uhm, uhm, uhm, and create a question in such a way that the answer to that questions can be taken from the text snippets from this document. and make sure it is comprehensive and it is make sure it's,

[22:01] uh, it completely answers the question, right, so it's something like that, right. Right now, again, it takes it from one document as well. I think the next version will have some capability of multiple document, uh, ground truth, uh, you know, that. So, right now, it's just one document. So, this is what this, basically, uh, configuration does, which is dimension-driven, we call it. Basically, we create different dimensions, create a value to it, and it figures out different problems. You can add more dimensions to it, right? You can,

[22:27] uh, delete value, you can add value. So, all those things you can do. And then, finally, in the preference, these things are extra there, like, what is the tone on which the question you want to have, right? And any focus area that you want to keep, you can have that. So, it's an extra information. And these things are there, like, question types, like, if it's a factual question, if it's a... So, again, these are, like, parameters for you to generate completely

[22:57] new questions, essentially, right? So, these are things which will help you get started. But ultimately, you should ideally review all of those, and if you're really serious about using the dataset, then review all the questions and, uh, corresponding answers to that or the chunks or the character spans from the documents, and edit that as well, which is something that Cable TV will, which will bring in it. So that you have a, and spend some time there, it's okay to spend some time here.

[23:24] Think about the question that you were asked. I think it's a really good way to really get in the user's mind. And this will really help you build a dataset, which will be which you can rely on, essentially, right? But if a retriever is giving good value, good result for this particular dataset, then that retriever is really good, right? So, uhm, so it's worth spending, you know, good time, a little bit of time here.

[23:50] And, uhm, then, finally, you can put, go to reviews, uh, step, where, I mean, you can review this previous configuration and you have a option to increase the number, like, put a number of questions, right? And maximum you can put 200 questions. Start with one. I would recommend to start less, maybe, maybe put 20 questions initially. And then see, because question generation takes time,

[24:16] right? Uhm, and it takes, you know, I mean, it takes time, essentially. And use the tokens, obviously, right? So, uh, I'll start with 20, maybe, and let it generate. And you can also change priority of these documents as well. By default, everyone has same priority. So, I mean, it has some calculation. I think it remains the same as it was in the last document. We can improve upon that as well.

[24:43] But if I increase the priority of this document, you can see it became 5. Or even increase further, it remains 5. But if I increase this one, it gets 4 for it. So, uh, so that means that for these 6 documents, 4 questions will be generated from this document, 4 will be from this, 3 will be from this. If I want to, let's say, remove, let's say, I remove, I want to deprioritize this one,

[25:10] then only one question will be generated, right? So this is an extra thing that you want to use, if you want to use to prioritize which documents are more important for your, that's it, that's it, that's it, that's it. And then you can click on Create or Generate, it will then start doing it, you can see it is in preparing, preparation stage, number of documents and questions,

[25:36] how many documents are processed, how many questions are generated, it will be visible here, you can see here, it started coming. And, it found some of these, you can see this was the, if you remember, this was one of the messages from the user questions, right? So again, you can see this is not a question exactly, very cryptic. We have a URL example. I'm not that cryptic, but, uh,

[26:02] but that's how users will say things, right? They will just say stuff, uhm, that, uh, you have to be prepared for. That's why real-world questions, grounding is the most important one, and you should really try to get real-world questions. Because that will just improve the quality of your dataset. So I think you can see here, it was able to generate to 14 questions or something, yeah. So yeah, there's something I think I need to fix. Uhm,

[26:29] uh, what happens is, I think, yeah, if this number of documents are less, it is not able to find the questions, answers, right? So you need to have your KB, like, with a lot of documents, then it will work well. Because, for example, I've added 30 questions, right, in here. 30 questions, and it was able to find match for only 11 of these, right? I have to, I asked you to generate 20 questions, right? Most of you should have found the answers to maybe 18

[26:57] of them, because, uhm, those questions answers will be there in my full documentation, right? So that's why it's less. And because it's not able to find answers, it is, uhm, like, failing to, you find the corresponding spans, and that's why, you know, it's, uh, it's less. Less, right, uhm, than what you asked. But, again, anyways, you can see out of 14,

[27:22] 11 are, uh, real-world questions and corresponding span. And this is the place I'd leave you, want to review and edit stuff, right? So I would definitely be adding the edit feature next. This is the most important one, and this is a place, You get to spend some time to do things. You can add more stuff as well here, right? So I think this will be a nice view. In the rendered view, you can just highlight something,

[27:48] and it will just say, you know, add to this thing, or add to something like that. Uh, yeah, I think this will be interesting. And here you can just edit the portion as it were itself, or make it a model or whatever. And, uh, once it's done, maybe it will have a tag, which is, modified or something or whatever, so that user knows, you know, this is something they've done with it. So, uh,

[28:15] and you can see that it has generated these four extra questions. Again, I'm not going to read through it. This is the work which ideally the domain experts should be able to, should be spending time to make sure it's done in a good way. And that's it. Uhm, next up, basically, very quickly, if I can talk about in the retriever system, first of all, you can create new retrievers, you know, like this, basically. And each of the retrievers, so I'll talk about this in the next

[28:41] video, where you can see, again, this is six documents, KB, small KB, but you can see, uh, the document information and you can see how chunking happened, you can do some querying. You have a playground here, so you can inspect overall what happened in the retriever, just so that you understand, uh, what's going on. And then there's an experiment mode, where, uh, you can create new experiments,

[29:09] give a name to it. Select a dataset that you have created earlier, which is the old dataset that you are, you know, working on. Then you can select one or multiple retrievers. And then you can, uh, you know, have these little pooled values. I can talk about that, what is recall, what expression means. And these are just derivatives of these two. But basically these are the two main ones. And there is a ranking formula as well, which I will talk about again, selecting weighted sum of these two values. Uhm,

[29:35] again, things can be improved here, but this is what we have right now. I can give a name and I can select a dataset. Let's say on that dataset itself I have created, so let's say Experiment2Map, let's say. And I click on what I selected. Let me select all five videos. All of them actually. Right.

[30:02] Whatever. Otherwise it will just take a lot of time. Oh, let me do that. Yes. So, create experiment. So, it's, what it is doing, there are seven retrievers, essentially. And, uh, you can see that right now evaluation is going on. And what it will do is, it will, ah, use each of these retrievers on the same kb against that question that is set. And it will,

[30:30] each of the questions here that you have seen, like for this 14 questions data set, it has a, uh, ground truth. These are the characteristics, but it has a ground truth, which is the actual correct value for it, right? So in the retrievers experiment, you can see what it is doing is it is, uh, using this retriever, the OpenCLOS style retriever, which has some configuration of its own, it will, this is it.

[31:02] basically get the chunks for the corresponding questions, each question in this data set. This is the data set name, unified whatever, uh, timestamp. So, uhm, we have to improve the name of this data set as well. But, uhm, it will, uh, do this. Get the chunks and then it will compare it with the ground truth and depending on how much exact overlap, you know, that it got from the ground truth value,

[31:31] it will basically, uh, uhm, calculate these values essentially, So you can see here right now it is doing this because we have added a lot of, uh, these things. So now you can see it has, uh, done evaluation for these two retrievers and it found that the hyper, height, dense is, has a recall of 18.4% and this one has, uh, it has added a third one.

[31:57] So what it is doing is basically generating the recall and precision value and final score which is the weighted sum of these two to give a final ranking to these retrievers. And, uh, yeah, so it's right now doing this right now it did 3, uh, 4 actually and as it does if it finds a better ranking it will update it here, right? So this way I can really measure how really, you know, how good the,

[32:25] the retriever is working. If this percentage is 100 percent then that is the best retriever against that dataset, against the old dataset. So, so that is the, that is the idea. Uhm, yeah. And now we can go back and create better retrievers, test it, and see, and make sure the old dataset is also good. So, you know, see how it works out. Again, I can go deeper into this thing, but this is just how this

[32:53] experiment worked out. And that's it, you know, that's the whole idea of, you know, this overall system basically helps you evaluate against multiple retrievers. Basically evaluate different different retrievers against one specific gold dataset of your questions and ground truth and generate a value. Again, it's a, not really a complete, uhm, 100% accurate, even if you get 100% accurate here, you know, obviously in the real world it will fail,

[33:19] because, uh, you can ask a new question completely, you know, which it has no idea, but if you have made a really good diverse question dataset, then it will, uh, basically get very close to serving most of the users, essentially, right? So that's the idea, right? So now you can see it has completed it, and it found that this BM25 rank, re-ranked, is the best retriever, which has 21.5% recall, which is not that great. So this definitely requires,

[33:44] uhm, like, improvement on the KB side of things, because I think KB is missing a lot of documents, because it's a very small document. But if I have a bigger KB with a lot of documents, I think it should work Try on this. I'm not sure if I have any triggers. Yeah, so right now I don't have it. I think I should try it on this one. And I think, and we'll even compare the results,

[34:11] right? So yeah, that is the whole idea. Uhm. Mostly I wanted to spend time on this about, uh, how to, uh, do question generation. And I think I covered this algorithm that I've been working on, I've been using. And I built the system. So if you want to try it out, it's all been live. Uh, I'll share the link. And it's an open source project. You can, uh, with MIT license, you can actually use it. You can build stuff on top of it if you want. Uh,

[34:37] feel free and share your thoughts. And, uh, uh, I mean, if you want, you can, you can, uh, share in PR as well. But, uh, yeah. I mean, I, I mean, I can take a look. Uh, but, uh, feel free to submit that. But, uh, give any feedback. I think that's the point, right? You can use this project. You can run it by yourself. You need a convex, uh, instance to do that. But rest, you can just run it by yourself. Anyways,

[35:04] that's a thing I wanted to share. I will make a more crisp video out of this for almost 34 minutes of rant.
