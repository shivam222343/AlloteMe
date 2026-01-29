const express = require('express');
const router = express.Router();
const College = require('../models/College');
const Cutoff = require('../models/Cutoff');
const AIKnowledge = require('../models/AIKnowledge');
const axios = require('axios');

// AI Counselor Chat with Context
router.post('/', async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        console.log('AI Chat Request:', message);

        // 1. Search for relevant context in the database
        const colleges = await College.find({}).lean();
        const knowledgeBase = await AIKnowledge.find({}).lean();

        // Improved Search Logic: Look for keyword overlaps
        const userMessageLower = message.toLowerCase();

        // Search Knowledge Base for similar questions or matching tags
        const relevantKnowledge = knowledgeBase.filter(k => {
            const questionMatch = k.question.toLowerCase().split(' ').some(word =>
                word.length > 3 && userMessageLower.includes(word)
            );
            const tagMatch = k.tags.some(tag => userMessageLower.includes(tag.toLowerCase()));
            return questionMatch || tagMatch || userMessageLower.includes(k.question.toLowerCase());
        }).slice(0, 5);

        // Search for mentioned colleges (by Name or Code)
        let mentionedColleges = colleges.filter(c => {
            const nameMatch = userMessageLower.includes(c.name.toLowerCase());
            const codeMatch = c.code && message.includes(c.code.toString());
            const shortNameMatch = c.name.length > 3 && userMessageLower.includes(c.name.toLowerCase().substring(0, 4));
            return nameMatch || codeMatch || shortNameMatch;
        }).slice(0, 3);

        // If user asks for "top" or "best" and no specific colleges found, pick top 5 from DB
        if (mentionedColleges.length === 0 && (userMessageLower.includes('top') || userMessageLower.includes('best'))) {
            mentionedColleges = colleges
                .filter(c => c.rating)
                .sort((a, b) => b.rating - a.rating)
                .slice(0, 5);
        }

        let context = `You are a STRICT AI Admission Counselor for Maharashtra Engineering and Pharmacy admissions.
        
        CRITICAL RULES:
        1. Base your answer ONLY on the provided context. 
        2. If the answer is NOT found in the context below, state: "I'm sorry, I don't have this specific information in my database at the moment."
        3. DO NOT speculate or use general knowledge for cutoffs, fees, or dates.
        4. Be concise and professional.
        5. Use ### for headers and **Bold** for values.`;

        if (relevantKnowledge.length > 0) {
            context += "\n\nDATABASE - TRAINING DATA:\n";
            relevantKnowledge.forEach(k => {
                context += `- Fact: ${k.answer}\n`;
            });
        }

        if (mentionedColleges.length > 0) {
            context += "\n\nDATABASE - COLLEGE & CUTOFF DATA:\n";
            for (const col of mentionedColleges) {
                const cutoffs = await Cutoff.find({ collegeId: col._id }).sort({ year: -1 }).limit(10).lean();
                context += `- **${col.name}** (${col.code}): Location: ${col.city}. Fees: ₹${col.fees}. Rating: ${col.rating}/5. Status: ${col.collegeStatus}.\n`;
                if (cutoffs.length > 0) {
                    context += `  Verified Cutoffs:\n`;
                    cutoffs.forEach(cut => {
                        context += `  - ${cut.year} Round ${cut.round}: ${cut.branch} (${cut.category}) -> Rank ${cut.closingRank}, ${cut.percentile}%\n`;
                    });
                }
            }
        }

        // 2. Call Groq API (or any LLM)
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.1-8b-instant",
            messages: [
                { role: "system", content: context },
                ...(history || []),
                { role: "user", content: message }
            ],
            temperature: 0.7,
            max_tokens: 1024
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY || 'gsk_xWbWpGshkU2N8y6R6R6R6R6R6R6R6R6R6R6R6R6R6R6R6R6R6R6R'}`, // Placeholder if not in env
                'Content-Type': 'application/json'
            }
        });

        const botReply = response.data.choices[0].message.content;

        res.json({
            success: true,
            reply: botReply
        });

    } catch (error) {
        console.error('Chat Error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'AI Counselor is busy. Please try again later.',
            error: error.message
        });
    }
});

module.exports = router;
