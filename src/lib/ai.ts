import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
});

const SYSTEM_PROMPT = `You are an expert resume editor and career coach. You help users improve their resumes by:
- Making content more impactful and achievement-oriented
- Using strong action verbs
- Quantifying accomplishments where possible
- Maintaining professional tone
- Ensuring ATS-friendly formatting

You work with LaTeX resume content. When editing, preserve the LaTeX structure and commands.
Be concise and direct in your responses.`;

/**
 * Edit a specific section of the resume based on user instruction
 */
export async function editResumeSection(
    selectedText: string,
    instruction: string,
    fullContent?: string
): Promise<string> {
    const contextMessage = fullContent
        ? `\n\nFor context, here's the full resume:\n${fullContent.substring(0, 2000)}...`
        : "";

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
                role: "user",
                content: `Edit the following LaTeX resume section based on this instruction: "${instruction}"

Selected text to edit:
\`\`\`latex
${selectedText}
\`\`\`
${contextMessage}

Respond with ONLY the edited LaTeX code, no explanations or markdown code blocks.`,
            },
        ],
        temperature: 0.7,
        max_tokens: 1000,
    });

    return response.choices[0]?.message?.content?.trim() || selectedText;
}

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

interface ChatResponse {
    message: string;
    suggestedEdit?: {
        original: string;
        replacement: string;
        description: string;
    };
}

/**
 * Chat with the AI about the resume, with ability to suggest edits (non-streaming)
 */
export async function chatWithResume(
    messages: ChatMessage[],
    resumeContent: string
): Promise<ChatResponse> {
    const systemMessage = `${SYSTEM_PROMPT}

Current resume content (LaTeX):
\`\`\`latex
${resumeContent.substring(0, 4000)}
\`\`\`

When the user asks for changes, respond in this JSON format:
{
  "message": "Your response explaining what you'll change",
  "suggestedEdit": {
    "original": "the exact text to find and replace",
    "replacement": "the new text",
    "description": "brief description of the change"
  }
}

If no edit is needed (just answering a question), respond with:
{
  "message": "Your response"
}

Always respond with valid JSON.`;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: systemMessage },
            ...messages.map((m) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
            })),
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || '{"message": "I couldn\'t process that request."}';

    try {
        return JSON.parse(content) as ChatResponse;
    } catch {
        return { message: content };
    }
}

/**
 * Stream chat response for real-time display
 * Returns an OpenAI stream that can be iterated for chunks
 */
export async function streamChatWithResume(
    messages: ChatMessage[],
    resumeContent: string
) {
    const systemMessage = `You are an expert resume editor integrated into a LaTeX resume editor application.

CRITICAL: You have FULL ACCESS to the user's resume content below. You CAN and SHOULD directly read, reference, and suggest changes to ANY part of it. DO NOT ask the user to provide content that is already visible to you below.

=== USER'S COMPLETE RESUME (LATEX) ===
${resumeContent}
=== END OF RESUME ===

YOUR CAPABILITIES:
- You can see the ENTIRE resume above
- You can identify sections like Education, Experience, Skills, Summary, etc.
- You can quote specific text from the resume
- You can suggest precise changes to any part

INSTRUCTIONS:
1. When the user asks to improve something (e.g., "improve my education section"), LOOK at the resume above and find that section
2. Quote the current text you're changing so the user knows exactly what you're modifying
3. Provide the improved version

CHANGE FORMAT - When suggesting edits, use this EXACT format:

===CHANGE===
FIND: [copy the EXACT text from the resume above that needs to change]
REPLACE: [the new improved text]
===END===

EXAMPLE:
User: "Make my education section more impactful"
You: "I can see your education section. Let me improve it:

===CHANGE===
FIND: Bachelor of Science in Computer Science
REPLACE: Bachelor of Science in Computer Science | GPA: 3.8/4.0 | Dean's List
===END===

This adds GPA and honors to make it more impressive."

Remember: You HAVE the resume. Use it. Don't ask for what you can already see.`;

    const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: systemMessage },
            ...messages.map((m) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
            })),
        ],
        temperature: 0.7,
        max_tokens: 1500,
        stream: true,
    });

    return stream;
}

/**
 * Generate suggestions for improving the resume
 */
export async function getResumeSuggestions(resumeContent: string): Promise<string[]> {
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
                role: "user",
                content: `Analyze this resume and provide 3-5 brief, actionable suggestions for improvement. Be specific.

Resume:
\`\`\`latex
${resumeContent.substring(0, 4000)}
\`\`\`

Respond with a JSON array of suggestion strings.`,
            },
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || '{"suggestions": []}';

    try {
        const parsed = JSON.parse(content);
        return parsed.suggestions || [];
    } catch {
        return [];
    }
}

/**
 * Fix a LaTeX compilation error
 */
export async function fixLatexError(
    latexContent: string,
    errorMessage: string
): Promise<string> {
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `You are an expert LaTeX debugger. Your task is to fix LaTeX compilation errors.

When given LaTeX code and an error message, you will:
1. Analyze the error message to understand what went wrong
2. Find the problematic code in the LaTeX content
3. Fix the error while preserving the document's intended structure and content
4. Return ONLY the corrected full LaTeX code, nothing else

Common LaTeX errors include:
- Missing closing braces or brackets
- Undefined control sequences (misspelled commands)
- Missing packages
- Illegal parameter numbers in newcommand
- Extra alignment tabs (&)
- Missing \\end{...} for environments
- Package microtype Error (If seen, REMOVE the microtype package entirely, as it conflicts with XeLaTeX)

Return ONLY the fixed LaTeX code. Do not include any explanations, markdown code blocks, or other text.`,
            },
            {
                role: "user",
                content: `Fix this LaTeX compilation error:

ERROR MESSAGE:
${errorMessage}

LATEX CONTENT:
${latexContent}

Return ONLY the corrected LaTeX code.`,
            },
        ],
        temperature: 0.3, // Lower temperature for more precise fixes
        max_tokens: 4000,
    });

    return response.choices[0]?.message?.content?.trim() || latexContent;
}

/**
 * ATS Score evaluation result interface
 */
export interface ATSEvaluationResult {
    overallScore: number;
    categoryScores: {
        keywords: number;
        formatting: number;
        contentQuality: number;
        sections: number;
    };
    bestFitRoles: {
        role: string;
        matchPercentage: number;
        reason: string;
    }[];
    strengths: string[];
    improvements: string[];
    suggestions: string[];
    summary: string;
}

/**
 * Evaluate a resume's ATS compatibility score
 */
export async function evaluateATSScore(resumeContent: string): Promise<ATSEvaluationResult> {
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `You are an expert ATS (Applicant Tracking System) analyzer and career advisor. Your job is to evaluate resumes for ATS compatibility, identify the best-fit job roles, and provide detailed, actionable feedback.

Analyze resumes based on these criteria:
1. **Keywords & Skills** (0-100): Presence of industry-standard keywords, skills, and technologies
2. **Formatting** (0-100): Clean structure, parseable format, no tables/graphics that confuse ATS
3. **Content Quality** (0-100): Action verbs, quantified achievements, professional language
4. **Sections** (0-100): Presence of standard sections (Contact, Summary, Experience, Education, Skills)

Also identify the TOP 3 job roles this resume is best suited for based on the skills, experience, and keywords present. Consider the candidate's background and provide specific role titles.

Provide your response in JSON format only.`,
            },
            {
                role: "user",
                content: `Analyze this resume for ATS compatibility and identify best-fit job roles:

${resumeContent}

Respond with a JSON object in this exact format:
{
    "overallScore": <number 0-100>,
    "categoryScores": {
        "keywords": <number 0-100>,
        "formatting": <number 0-100>,
        "contentQuality": <number 0-100>,
        "sections": <number 0-100>
    },
    "bestFitRoles": [
        {
            "role": "<specific job title like 'Full Stack Developer' or 'Data Scientist'>",
            "matchPercentage": <number 0-100>,
            "reason": "<brief explanation of why this role is a good fit>"
        },
        {
            "role": "<second best job title>",
            "matchPercentage": <number 0-100>,
            "reason": "<brief explanation>"
        },
        {
            "role": "<third best job title>",
            "matchPercentage": <number 0-100>,
            "reason": "<brief explanation>"
        }
    ],
    "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
    "improvements": ["<area needing improvement 1>", "<area needing improvement 2>"],
    "suggestions": ["<specific actionable suggestion 1>", "<specific actionable suggestion 2>", "<specific actionable suggestion 3>"],
    "summary": "<2-3 sentence overall assessment>"
}`,
            },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || '{}';

    try {
        const result = JSON.parse(content) as ATSEvaluationResult;
        // Ensure all required fields exist with defaults
        return {
            overallScore: result.overallScore ?? 0,
            categoryScores: {
                keywords: result.categoryScores?.keywords ?? 0,
                formatting: result.categoryScores?.formatting ?? 0,
                contentQuality: result.categoryScores?.contentQuality ?? 0,
                sections: result.categoryScores?.sections ?? 0,
            },
            bestFitRoles: result.bestFitRoles ?? [],
            strengths: result.strengths ?? [],
            improvements: result.improvements ?? [],
            suggestions: result.suggestions ?? [],
            summary: result.summary ?? "Unable to analyze resume.",
        };
    } catch {
        return {
            overallScore: 0,
            categoryScores: {
                keywords: 0,
                formatting: 0,
                contentQuality: 0,
                sections: 0,
            },
            bestFitRoles: [],
            strengths: [],
            improvements: [],
            suggestions: [],
            summary: "Failed to parse ATS evaluation results.",
        };
    }
}


/**
 * Convert resume text (from PDF/Word) to LaTeX format using a template as reference
 */
export async function convertResumeToLatex(
    resumeText: string,
    templateContent: string
): Promise<string> {
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `You are an expert resume formatter and LaTeX specialist. Your task is to convert resume content into properly formatted LaTeX code.

CRITICAL RULES:
1. Use the provided template as a STYLE REFERENCE - copy its exact LaTeX commands, formatting, colors, and structure
2. Extract ALL information from the user's resume (name, contact, experience, education, skills, etc.)
3. Preserve the exact template macros like \\resumeSubheading, \\resumeItem, \\resumeProjectHeading, etc.
4. Keep the same color scheme and section headers from the template
5. Return ONLY valid, compilable LaTeX code - no explanations or markdown
6. Ensure special characters are properly escaped for LaTeX (%, $, &, #, _, {, })
7. If the resume has sections not in the template, adapt them to match the template style
8. DO NOT add the 'microtype' package, as it conflicts with XeLaTeX fonts. If the template uses it, remove it.

OUTPUT: Return ONLY the complete LaTeX document from \\documentclass to \\end{document}.`,
            },
            {
                role: "user",
                content: `Convert the following resume content into LaTeX format using the provided template style.

=== TEMPLATE (use this exact style and structure) ===
${templateContent}
=== END TEMPLATE ===

=== RESUME CONTENT TO CONVERT ===
${resumeText}
=== END RESUME CONTENT ===

Generate a complete LaTeX document using the template's style with the resume content above. Return ONLY the LaTeX code.`,
            },
        ],
        temperature: 0.3, // Low temperature for consistent formatting
        max_tokens: 4000,
    });

    const result = response.choices[0]?.message?.content?.trim() || "";

    // Clean up any markdown code blocks if present
    let cleanedResult = result;
    if (cleanedResult.startsWith("```latex")) {
        cleanedResult = cleanedResult.slice(8);
    } else if (cleanedResult.startsWith("```")) {
        cleanedResult = cleanedResult.slice(3);
    }
    if (cleanedResult.endsWith("```")) {
        cleanedResult = cleanedResult.slice(0, -3);
    }

    return cleanedResult.trim();
}
