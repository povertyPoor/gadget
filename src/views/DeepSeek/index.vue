<template>
  
</template>

<script>
import OpenAI from "openai";

export default {
    data() {
        return {
            openai: null
        }
    },
    created() {
        this.openai = new OpenAI({
            baseURL: process.env.VUE_APP_DEEPSEEK_API_URL || 'https://api.deepseek.com', 
            apiKey: process.env.VUE_APP_DEEPSEEK_API_KEY,
            dangerouslyAllowBrowser: true 
        });
        this.main();
    },
    methods: {
        async main() {
            const completion = await this.openai.chat.completions.create({
                messages: [{ role: "system", content: "You are a helpful assistant." }],
                model: "deepseek-chat",
            });

            console.log(completion.choices[0].message.content);
        }
    }
}
</script>

<style>

</style>
