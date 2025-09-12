# Getting Started

This quickstart will walk you through making an AI model request with Vercel's [AI Gateway](https://vercel.com/ai-gateway). While this guide uses the [AI SDK](https://ai-sdk.dev), you can also integrate with the [OpenAI SDK](/docs/ai-gateway/openai-compat) or other [community frameworks](/docs/ai-gateway/framework-integrations).

1.  ### [Set up your application](#set-up-your-application)
    
    Start by creating a new directory using the `mkdir` command. Change into your new directory and then run the `pnpm init` command, which will create a `package.json`.
    
    ```
    mkdir demo
    cd demo
    pnpm init
    ```
    
2.  ### [Install dependencies](#install-dependencies)
    
    Install the AI SDK package, `ai`, along with other necessary dependencies.
    
    pnpmyarnnpmbun
    
    ```
    pnpm i ai dotenv @types/node tsx typescript
    ```
    
    `dotenv` is used to access environment variables (your AI Gateway API key) within your application. The `tsx` package is a TypeScript runner that allows you to run your TypeScript code. The `typescript` package is the TypeScript compiler. The `@types/node` package is the TypeScript definitions for the Node.js API.
    
3.  ### [Set up your API key](#set-up-your-api-key)
    
    To create an API key, go to the [AI Gateway](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai&title=Go+to+AI+Gateway) tab of the dashboard:
    
    1.  Select API keys on the left side bar
    2.  Then select Create key and proceed with Create key from the dialog
    
    Once you have the API key, create a `.env.local` file and save your API key:
    
    ```
    AI_GATEWAY_API_KEY=your_ai_gateway_api_key
    ```
    
    Instead of using an API key, you can use [OIDC tokens](/docs/ai-gateway/authentication#oidc-token-authentication) to authenticate your requests.
    
    The AI Gateway provider will default to using the `AI_GATEWAY_API_KEY` environment variable.
    
4.  ### [Create and run your script](#create-and-run-your-script)
    
    Create an `index.ts` file in the root of your project and add the following code:
    
    ```
    import { streamText } from 'ai';
    import 'dotenv/config';
     
    async function main() {
      const result = streamText({
        model: 'openai/gpt-5',
        prompt: 'Invent a new holiday and describe its traditions.',
      });
     
      for await (const textPart of result.textStream) {
        process.stdout.write(textPart);
      }
     
      console.log();
      console.log('Token usage:', await result.usage);
      console.log('Finish reason:', await result.finishReason);
    }
     
    main().catch(console.error);
    ```
    
    Now, run your script:
    
    ```
    pnpm tsx index.ts
    ```
    
    You should see the AI model's response to your prompt.
    
5.  ### [Next steps](#next-steps)
    
    Continue with the [AI SDK documentation](https://ai-sdk.dev/getting-started) to learn advanced configuration, set up provider routing and fallbacks, and explore more integration examples.
    

## [Using OpenAI SDK](#using-openai-sdk)

The AI Gateway provides OpenAI-compatible API endpoints that allow you to use existing OpenAI client libraries and tools with the AI Gateway.

The OpenAI-compatible API includes:

*   Model Management: List and retrieve the available models
*   Chat Completions: Create chat completions that support streaming, images, and file attachments
*   Tool Calls: Call functions with automatic or explicit tool selection
*   Existing Tool Integration: Use your existing OpenAI client libraries and tools without needing modifications

Learn more about using the OpenAI SDK with the AI Gateway in the [OpenAI-Compatible API page](/docs/ai-gateway/openai-compat).

## [Using other community frameworks](#using-other-community-frameworks)

The AI Gateway is designed to work with any framework that supports the OpenAI API or AI SDK 5.

Read more about using the AI Gateway with other community frameworks in the [framework integrations](/docs/ai-gateway/framework-integrations) section.