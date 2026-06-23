// js/ai.js - AI Magic using Groq API

const GroqAI = {
  getApiKey() {
    let key = localStorage.getItem('groq_api_key');
    if (!key) {
      key = prompt('Please enter your Groq API Key to enable AI features:');
      if (key) {
        localStorage.setItem('groq_api_key', key.trim());
      }
    }
    return key;
  },

  async callGroq(promptText, systemMessage = "You are a helpful AI assistant.") {
    const API_KEY = this.getApiKey();
    if (!API_KEY) {
      throw new Error("Groq API key not provided.");
    }
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: promptText }
          ],
          temperature: 0.3
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'API Error');
      return data.choices[0].message.content;
    } catch (e) {
      console.error('Groq API Error:', e);
      Toast.show('AI request failed.', null, null, 'error');
      return null;
    }
  },

  async breakdownTask(taskId) {
    const task = State.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    Toast.show('✨ AI is breaking down your task...');
    
    // Add a loading state flag to UI if necessary, but toast is okay for now
    const prompt = `Break down the following task into 3-5 small actionable subtasks. Return ONLY a valid JSON array of strings, with no markdown formatting, no backticks, and no extra text whatsoever. Example: ["Research the topic", "Write draft", "Review"]. Task: "${task.text}"${task.notes ? ` Notes: "${task.notes}"` : ''}`;
    
    const result = await this.callGroq(prompt);
    if (result) {
      try {
        // Very robust JSON parsing since LLMs sometimes wrap in markdown
        let cleaned = result.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        // Find array bounds
        const start = cleaned.indexOf('[');
        const end = cleaned.lastIndexOf(']');
        if (start !== -1 && end !== -1) {
          cleaned = cleaned.substring(start, end + 1);
        }

        const parsed = JSON.parse(cleaned);
        const subtasks = parsed.map(text => ({ text: String(text).trim(), completed: false }));
        
        task.subtasks = [...(task.subtasks || []), ...subtasks];
        State.saveTasks();
        Toast.show('✨ Task broken down successfully!');
      } catch(e) {
        console.error("Failed to parse AI response:", result);
        Toast.show('AI returned invalid format.');
      }
    }
  },

  async autoCategorize(text) {
    const prompt = `Given the task: "${text}", suggest the best category (personal, work, study, other) and priority (low, medium, high). Return ONLY valid JSON like {"category": "work", "priority": "high"}. No backticks.`;
    const result = await this.callGroq(prompt);
    if (result) {
      try {
        let cleaned = result.replace(/```json/gi, '').replace(/```/g, '').trim();
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
          cleaned = cleaned.substring(start, end + 1);
        }
        return JSON.parse(cleaned);
      } catch(e) {
        return null;
      }
    }
    return null;
  }
};
