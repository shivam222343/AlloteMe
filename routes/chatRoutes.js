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

        // Search Knowledge Base for similar questions
        const relevantKnowledge = knowledgeBase.filter(k =>
            message.toLowerCase().includes(k.question.toLowerCase()) ||
            k.tags.some(tag => message.toLowerCase().includes(tag.toLowerCase()))
        ).slice(0, 5);

        const mentionedColleges = colleges.filter(c =>
            message.toLowerCase().includes(c.name.toLowerCase()) ||
            (c.code && message.includes(c.code))
        ).slice(0, 3);

        let context = "You are an expert college counselor for Maharashtra admissions (MHT-CET, JEE). ";

        if (relevantKnowledge.length > 0) {
            context += "\nHere is some specific knowledge for this query:\n";
            relevantKnowledge.forEach(k => {
                context += `- Q: ${k.question}\n  A: ${k.answer}\n`;
            });
        }

        if (mentionedColleges.length > 0) {
            context += "\nHere is information about the colleges mentioned/relevant:\n";
            for (const col of mentionedColleges) {
                const cutoffs = await Cutoff.find({ collegeId: col._id }).sort({ year: -1 }).limit(10).lean();
                context += `- **${col.name}** (Code: ${col.code || 'N/A'}): Located in ${col.city}, ${col.state}. Status: ${col.collegeStatus}. University: ${col.university}. Rating: ${col.rating}/5. Fees: ₹${col.fees}.\n`;
                if (cutoffs.length > 0) {
                    context += `  Latest Cutoffs:\n`;
                    cutoffs.forEach(cut => {
                        context += `  - ${cut.year} Round ${cut.round}: ${cut.branch} (${cut.category}) -> Closing Rank: ${cut.closingRank}, Percentile: ${cut.percentile}%\n`;
                    });
                }
            }
        } else if (message.toLowerCase().includes('top') || message.toLowerCase().includes('best')) {
            // Provide some top colleges as context
            const topColleges = colleges.sort((a, b) => b.rating - a.rating).slice(0, 5);
            context += "\nHere are some top rated colleges:\n";
            topColleges.forEach(col => {
                context += `- ${col.name} (${col.city}): Rating ${col.rating}/5, Fees ₹${col.fees}\n`;
            });
        }

        context += "\n\nIMPORTANT RULES:\n1. Use the provided context to answer accurately.\n2. If you don't know something, say you don't have that specific data.\n3. Keep it professional and helpful.\n4. Format: Use ### for headers and **Bold** for values.";

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
