# OpenAI-Compatible API

AI Gateway provides OpenAI-compatible API endpoints, letting you use multiple AI providers through a familiar interface. You can use existing OpenAI client libraries, switch to the AI Gateway with a URL change, and keep your current tools and workflows without code rewrites.

The OpenAI-compatible API implements the same specification as the [OpenAI API](https://platform.openai.com/docs/api-reference/chat).

## [Base URL](#base-url)

The OpenAI-compatible API is available at the following base URL:

`https://ai-gateway.vercel.sh/v1`

## [Authentication](#authentication)

The OpenAI-compatible API supports the same authentication methods as the main AI Gateway:

*   API key: Use your AI Gateway API key with the `Authorization: Bearer <token>` header
*   OIDC token: Use your Vercel OIDC token with the `Authorization: Bearer <token>` header

You only need to use one of these forms of authentication. If an API key is specified it will take precedence over any OIDC token, even if the API key is invalid.

## [Supported endpoints](#supported-endpoints)

The AI Gateway currently supports the following OpenAI-compatible endpoints:

*   [`GET /v1/models`](#list-models) - List available models
*   [`GET /v1/models/{model}`](#retrieve-model) - Retrieve a specific model
*   [`POST /v1/chat/completions`](#chat-completions) - Create chat completions with support for streaming, attachments, tool calls, and image generation
*   [`POST /v1/embeddings`](#embeddings) - Generate vector embeddings
*   [`GET /v1/credits`](#credits) - Check AI Gateway credit balance and usage

## [Integration with existing tools](#integration-with-existing-tools)

You can use the AI Gateway's OpenAI-compatible API with existing tools and libraries like the [OpenAI client libraries](https://platform.openai.com/docs/libraries) and [AI SDK 4](https://v4.ai-sdk.dev/). Point your existing client to the AI Gateway's base URL and use your AI Gateway [API key](/docs/ai-gateway/authentication#api-key) or [OIDC token](/docs/ai-gateway/authentication#oidc-token) for authentication.

### [OpenAI client libraries](#openai-client-libraries)

TypeScriptPython

```
import OpenAI from 'openai';
 
const openai = new OpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const response = await openai.chat.completions.create({
  model: 'anthropic/claude-sonnet-4',
  messages: [{ role: 'user', content: 'Hello, world!' }],
});
```

```
import os
from openai import OpenAI
 
client = OpenAI(
    api_key=os.getenv('AI_GATEWAY_API_KEY'),
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
response = client.chat.completions.create(
    model='anthropic/claude-sonnet-4',
    messages=[
        {'role': 'user', 'content': 'Hello, world!'}
    ]
)
```

### [AI SDK 4](#ai-sdk-4)

For compatibility with [AI SDK v4](https://v4.ai-sdk.dev/) and AI Gateway, install the [@ai-sdk/openai-compatible](https://ai-sdk.dev/providers/openai-compatible-providers) package.

Verify that you are using AI SDK 4 by using the following package versions: `@ai-sdk/openai-compatible` version `<1.0.0` (e.g., `0.2.16`) and `ai` version `<5.0.0` (e.g., `4.3.19`).

```
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText } from 'ai';
 
const gateway = createOpenAICompatible({
  name: 'openai',
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const response = await generateText({
  model: gateway('anthropic/claude-sonnet-4'),
  prompt: 'Hello, world!',
});
```

## [List models](#list-models)

Retrieve a list of all available models that can be used with the AI Gateway.

Endpoint

`GET /v1/models`

Example request

```
import OpenAI from 'openai';
 
const openai = new OpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const models = await openai.models.list();
console.log(models);
```

```
import os
from openai import OpenAI
 
client = OpenAI(
    api_key=os.getenv('AI_GATEWAY_API_KEY'),
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
models = client.models.list()
print(models)
```

Response format

The response follows the OpenAI API format:

```
{
  "object": "list",
  "data": [
    {
      "id": "anthropic/claude-sonnet-4",
      "object": "model",
      "created": 1677610602,
      "owned_by": "anthropic"
    },
    {
      "id": "openai/gpt-4.1-mini",
      "object": "model",
      "created": 1677610602,
      "owned_by": "openai"
    }
  ]
}
```

## [Retrieve model](#retrieve-model)

Retrieve details about a specific model.

Endpoint

`GET /v1/models/{model}`

Parameters

*   `model` (required): The model ID to retrieve (e.g., `anthropic/claude-sonnet-4`)

Example request

```
import OpenAI from 'openai';
 
const openai = new OpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const model = await openai.models.retrieve('anthropic/claude-sonnet-4');
console.log(model);
```

```
import os
from openai import OpenAI
 
client = OpenAI(
    api_key=os.getenv('AI_GATEWAY_API_KEY'),
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
model = client.models.retrieve('anthropic/claude-sonnet-4')
print(model)
```

Response format

```
{
  "id": "anthropic/claude-sonnet-4",
  "object": "model",
  "created": 1677610602,
  "owned_by": "anthropic"
}
```

## [Chat completions](#chat-completions)

Create chat completions using various AI models available through the AI Gateway.

Endpoint

`POST /v1/chat/completions`

### [Basic chat completion](#basic-chat-completion)

Create a non-streaming chat completion.

Example request

```
import OpenAI from 'openai';
 
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const completion = await openai.chat.completions.create({
  model: 'anthropic/claude-sonnet-4',
  messages: [
    {
      role: 'user',
      content: 'Write a one-sentence bedtime story about a unicorn.',
    },
  ],
  stream: false,
});
 
console.log('Assistant:', completion.choices[0].message.content);
console.log('Tokens used:', completion.usage);
```

```
import os
from openai import OpenAI
 
api_key = os.getenv('AI_GATEWAY_API_KEY') or os.getenv('VERCEL_OIDC_TOKEN')
 
client = OpenAI(
    api_key=api_key,
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
completion = client.chat.completions.create(
    model='anthropic/claude-sonnet-4',
    messages=[
        {
            'role': 'user',
            'content': 'Write a one-sentence bedtime story about a unicorn.'
        }
    ],
    stream=False,
)
 
print('Assistant:', completion.choices[0].message.content)
print('Tokens used:', completion.usage)
```

Response format

```
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "anthropic/claude-sonnet-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Once upon a time, a gentle unicorn with a shimmering silver mane danced through moonlit clouds, sprinkling stardust dreams upon sleeping children below."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 28,
    "total_tokens": 43
  }
}
```

### [Streaming chat completion](#streaming-chat-completion)

Create a streaming chat completion that streams tokens as they are generated.

Example request

```
import OpenAI from 'openai';
 
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const stream = await openai.chat.completions.create({
  model: 'anthropic/claude-sonnet-4',
  messages: [
    {
      role: 'user',
      content: 'Write a one-sentence bedtime story about a unicorn.',
    },
  ],
  stream: true,
});
 
for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    process.stdout.write(content);
  }
}
```

```
import os
from openai import OpenAI
 
api_key = os.getenv('AI_GATEWAY_API_KEY') or os.getenv('VERCEL_OIDC_TOKEN')
 
client = OpenAI(
    api_key=api_key,
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
stream = client.chat.completions.create(
    model='anthropic/claude-sonnet-4',
    messages=[
        {
            'role': 'user',
            'content': 'Write a one-sentence bedtime story about a unicorn.'
        }
    ],
    stream=True,
)
 
for chunk in stream:
    content = chunk.choices[0].delta.content
    if content:
        print(content, end='', flush=True)
```

#### [Streaming response format](#streaming-response-format)

Streaming responses are sent as [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events), a web standard for real-time data streaming over HTTP. Each event contains a JSON object with the partial response data.

The response format follows the OpenAI streaming specification:

```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"anthropic/claude-sonnet-4","choices":[{"index":0,"delta":{"content":"Once"},"finish_reason":null}]}
 
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"anthropic/claude-sonnet-4","choices":[{"index":0,"delta":{"content":" upon"},"finish_reason":null}]}
 
data: [DONE]
```

Key characteristics:

*   Each line starts with `data:` followed by JSON
*   Content is delivered incrementally in the `delta.content` field
*   The stream ends with `data: [DONE]`
*   Empty lines separate events

SSE Parsing Libraries:

If you're building custom SSE parsing (instead of using the OpenAI SDK), these libraries can help:

*   JavaScript/TypeScript: [`eventsource-parser`](https://www.npmjs.com/package/eventsource-parser) - Robust SSE parsing with support for partial events
*   Python: [`httpx-sse`](https://pypi.org/project/httpx-sse/) - SSE support for HTTPX, or [`sseclient-py`](https://pypi.org/project/sseclient-py/) for requests

For more details about the SSE specification, see the [W3C specification](https://html.spec.whatwg.org/multipage/server-sent-events.html).

### [Image attachments](#image-attachments)

Send images as part of your chat completion request.

Example request

```
import fs from 'node:fs';
import OpenAI from 'openai';
 
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
// Read the image file as base64
const imageBuffer = fs.readFileSync('./path/to/image.png');
const imageBase64 = imageBuffer.toString('base64');
 
const completion = await openai.chat.completions.create({
  model: 'anthropic/claude-sonnet-4',
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Describe this image in detail.' },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/png;base64,${imageBase64}`,
            detail: 'auto',
          },
        },
      ],
    },
  ],
  stream: false,
});
 
console.log('Assistant:', completion.choices[0].message.content);
console.log('Tokens used:', completion.usage);
```

```
import os
import base64
from openai import OpenAI
 
api_key = os.getenv('AI_GATEWAY_API_KEY') or os.getenv('VERCEL_OIDC_TOKEN')
 
client = OpenAI(
    api_key=api_key,
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
# Read the image file as base64
with open('./path/to/image.png', 'rb') as image_file:
    image_base64 = base64.b64encode(image_file.read()).decode('utf-8')
 
completion = client.chat.completions.create(
    model='anthropic/claude-sonnet-4',
    messages=[
        {
            'role': 'user',
            'content': [
                {'type': 'text', 'text': 'Describe this image in detail.'},
                {
                    'type': 'image_url',
                    'image_url': {
                        'url': f'data:image/png;base64,{image_base64}',
                        'detail': 'auto'
                    }
                }
            ]
        }
    ],
    stream=False,
)
 
print('Assistant:', completion.choices[0].message.content)
print('Tokens used:', completion.usage)
```

### [PDF attachments](#pdf-attachments)

Send PDF documents as part of your chat completion request.

Example request

```
import fs from 'node:fs';
import OpenAI from 'openai';
 
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
// Read the PDF file as base64
const pdfBuffer = fs.readFileSync('./path/to/document.pdf');
const pdfBase64 = pdfBuffer.toString('base64');
 
const completion = await openai.chat.completions.create({
  model: 'anthropic/claude-sonnet-4',
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'What is the main topic of this document? Please summarize the key points.',
        },
        {
          type: 'file',
          file: {
            data: pdfBase64,
            media_type: 'application/pdf',
            filename: 'document.pdf',
          },
        },
      ],
    },
  ],
  stream: false,
});
 
console.log('Assistant:', completion.choices[0].message.content);
console.log('Tokens used:', completion.usage);
```

```
import os
import base64
from openai import OpenAI
 
api_key = os.getenv('AI_GATEWAY_API_KEY') or os.getenv('VERCEL_OIDC_TOKEN')
 
client = OpenAI(
    api_key=api_key,
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
# Read the PDF file as base64
with open('./path/to/document.pdf', 'rb') as pdf_file:
    pdf_base64 = base64.b64encode(pdf_file.read()).decode('utf-8')
 
completion = client.chat.completions.create(
    model='anthropic/claude-sonnet-4',
    messages=[
        {
            'role': 'user',
            'content': [
                {
                    'type': 'text',
                    'text': 'What is the main topic of this document? Please summarize the key points.'
                },
                {
                    'type': 'file',
                    'file': {
                        'data': pdf_base64,
                        'media_type': 'application/pdf',
                        'filename': 'document.pdf'
                    }
                }
            ]
        }
    ],
    stream=False,
)
 
print('Assistant:', completion.choices[0].message.content)
print('Tokens used:', completion.usage)
```

### [Tool calls](#tool-calls)

The AI Gateway supports OpenAI-compatible function calling, allowing models to call tools and functions. This follows the same specification as the [OpenAI Function Calling API](https://platform.openai.com/docs/guides/function-calling).

#### [Basic tool calls](#basic-tool-calls)

```
import OpenAI from 'openai';
 
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get the current weather in a given location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city and state, e.g. San Francisco, CA',
          },
          unit: {
            type: 'string',
            enum: ['celsius', 'fahrenheit'],
            description: 'The unit for temperature',
          },
        },
        required: ['location'],
      },
    },
  },
];
 
const completion = await openai.chat.completions.create({
  model: 'anthropic/claude-sonnet-4',
  messages: [
    {
      role: 'user',
      content: 'What is the weather like in San Francisco?',
    },
  ],
  tools: tools,
  tool_choice: 'auto',
  stream: false,
});
 
console.log('Assistant:', completion.choices[0].message.content);
console.log('Tool calls:', completion.choices[0].message.tool_calls);
```

```
import os
from openai import OpenAI
 
api_key = os.getenv('AI_GATEWAY_API_KEY') or os.getenv('VERCEL_OIDC_TOKEN')
 
client = OpenAI(
    api_key=api_key,
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
tools = [
    {
        'type': 'function',
        'function': {
            'name': 'get_weather',
            'description': 'Get the current weather in a given location',
            'parameters': {
                'type': 'object',
                'properties': {
                    'location': {
                        'type': 'string',
                        'description': 'The city and state, e.g. San Francisco, CA'
                    },
                    'unit': {
                        'type': 'string',
                        'enum': ['celsius', 'fahrenheit'],
                        'description': 'The unit for temperature'
                    }
                },
                'required': ['location']
            }
        }
    }
]
 
completion = client.chat.completions.create(
    model='anthropic/claude-sonnet-4',
    messages=[
        {
            'role': 'user',
            'content': 'What is the weather like in San Francisco?'
        }
    ],
    tools=tools,
    tool_choice='auto',
    stream=False,
)
 
print('Assistant:', completion.choices[0].message.content)
print('Tool calls:', completion.choices[0].message.tool_calls)
```

Controlling tool selection: By default, `tool_choice` is set to `'auto'`, allowing the model to decide when to use tools. You can also:

*   Set to `'none'` to disable tool calls
*   Force a specific tool with: `tool_choice: { type: 'function', function: { name: 'your_function_name' } }`

#### [Tool call response format](#tool-call-response-format)

When the model makes tool calls, the response includes tool call information:

```
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "anthropic/claude-sonnet-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": null,
        "tool_calls": [
          {
            "id": "call_123",
            "type": "function",
            "function": {
              "name": "get_weather",
              "arguments": "{\"location\": \"San Francisco, CA\", \"unit\": \"celsius\"}"
            }
          }
        ]
      },
      "finish_reason": "tool_calls"
    }
  ],
  "usage": {
    "prompt_tokens": 82,
    "completion_tokens": 18,
    "total_tokens": 100
  }
}
```

### [Provider options](#provider-options)

The AI Gateway can route your requests across multiple AI providers for better reliability and performance. You can control which providers are used and in what order through the `providerOptions` parameter.

Example request

```
import OpenAI from 'openai';
 
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
// @ts-expect-error
const completion = await openai.chat.completions.create({
  model: 'anthropic/claude-sonnet-4',
  messages: [
    {
      role: 'user',
      content:
        'Tell me the history of the San Francisco Mission-style burrito in two paragraphs.',
    },
  ],
  stream: false,
  // Provider options for gateway routing preferences
  providerOptions: {
    gateway: {
      order: ['vertex', 'anthropic'], // Try Vertex AI first, then Anthropic
    },
  },
});
 
console.log('Assistant:', completion.choices[0].message.content);
console.log('Tokens used:', completion.usage);
```

```
import os
from openai import OpenAI
 
api_key = os.getenv('AI_GATEWAY_API_KEY') or os.getenv('VERCEL_OIDC_TOKEN')
 
client = OpenAI(
    api_key=api_key,
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
completion = client.chat.completions.create(
    model='anthropic/claude-sonnet-4',
    messages=[
        {
            'role': 'user',
            'content': 'Tell me the history of the San Francisco Mission-style burrito in two paragraphs.'
        }
    ],
    stream=False,
    # Provider options for gateway routing preferences
    extra_body={
        'providerOptions': {
            'gateway': {
                'order': ['vertex', 'anthropic']  # Try Vertex AI first, then Anthropic
            }
        }
    }
)
 
print('Assistant:', completion.choices[0].message.content)
print('Tokens used:', completion.usage)
```

Provider routing: In this example, the gateway will first attempt to use Vertex AI to serve the Claude model. If Vertex AI is unavailable or fails, it will fall back to Anthropic. Other providers are still available but will only be used after the specified providers.

#### [Streaming with provider options](#streaming-with-provider-options)

Provider options work with streaming requests as well:

```
import OpenAI from 'openai';
 
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
// @ts-expect-error
const stream = await openai.chat.completions.create({
  model: 'anthropic/claude-sonnet-4',
  messages: [
    {
      role: 'user',
      content:
        'Tell me the history of the San Francisco Mission-style burrito in two paragraphs.',
    },
  ],
  stream: true,
  providerOptions: {
    gateway: {
      order: ['vertex', 'anthropic'],
    },
  },
});
 
for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    process.stdout.write(content);
  }
}
```

```
import os
from openai import OpenAI
 
api_key = os.getenv('AI_GATEWAY_API_KEY') or os.getenv('VERCEL_OIDC_TOKEN')
 
client = OpenAI(
    api_key=api_key,
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
stream = client.chat.completions.create(
    model='anthropic/claude-sonnet-4',
    messages=[
        {
            'role': 'user',
            'content': 'Tell me the history of the San Francisco Mission-style burrito in two paragraphs.'
        }
    ],
    stream=True,
    extra_body={
        'providerOptions': {
            'gateway': {
                'order': ['vertex', 'anthropic']
            }
        }
    }
)
 
for chunk in stream:
    content = chunk.choices[0].delta.content
    if content:
        print(content, end='', flush=True)
```

For more details about available providers and advanced provider configuration, see the [Provider Options documentation](/docs/ai-gateway/provider-options).

### [Parameters](#parameters)

The chat completions endpoint supports the following parameters:

#### [Required parameters](#required-parameters)

*   `model` (string): The model to use for the completion (e.g., `anthropic/claude-sonnet-4`)
*   `messages` (array): Array of message objects with `role` and `content` fields

#### [Optional parameters](#optional-parameters)

*   `stream` (boolean): Whether to stream the response. Defaults to `false`
*   `temperature` (number): Controls randomness in the output. Range: 0-2
*   `max_tokens` (integer): Maximum number of tokens to generate
*   `top_p` (number): Nucleus sampling parameter. Range: 0-1
*   `frequency_penalty` (number): Penalty for frequent tokens. Range: -2 to 2
*   `presence_penalty` (number): Penalty for present tokens. Range: -2 to 2
*   `stop` (string or array): Stop sequences for the generation
*   `tools` (array): Array of tool definitions for function calling
*   `tool_choice` (string or object): Controls which tools are called (`auto`, `none`, or specific function)
*   `providerOptions` (object): [Provider routing and configuration options](#provider-options)
*   `response_format` (object): Controls the format of the model's response
    *   `type` (string): Either `"text"` or `"json"`
    *   `schema` (object, optional): JSON schema for structured responses when type is `"json"`
    *   `name` (string, optional): Name for the response format
    *   `description` (string, optional): Description of the format

### [Message format](#message-format)

Messages support different content types:

#### [Text messages](#text-messages)

```
{
  "role": "user",
  "content": "Hello, how are you?"
}
```

#### [Multimodal messages](#multimodal-messages)

```
{
  "role": "user",
  "content": [
    { "type": "text", "text": "What's in this image?" },
    {
      "type": "image_url",
      "image_url": {
        "url": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
      }
    }
  ]
}
```

#### [File messages](#file-messages)

```
{
  "role": "user",
  "content": [
    { "type": "text", "text": "Summarize this document" },
    {
      "type": "file",
      "file": {
        "data": "JVBERi0xLjQKJcfsj6IKNSAwIG9iago8PAovVHlwZSAvUGFnZQo...",
        "media_type": "application/pdf",
        "filename": "document.pdf"
      }
    }
  ]
}
```

## [Image generation](#image-generation)

Generate images using AI models that support multimodal output through the OpenAI-compatible API. This feature allows you to create images alongside text responses using models like Google's Gemini 2.5 Flash Image.

Endpoint

`POST /v1/chat/completions`

Parameters

To enable image generation, include the `modalities` parameter in your request:

*   `modalities` (array): Array of strings specifying the desired output modalities. Use `['text', 'image']` for both text and image generation, or `['image']` for image-only generation.

Example requests

TypeScriptPython

```
import OpenAI from 'openai';
 
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const completion = await openai.chat.completions.create({
  model: 'google/gemini-2.5-flash-image-preview',
  messages: [
    {
      role: 'user',
      content:
        'Generate a beautiful sunset over mountains and describe the scene.',
    },
  ],
  // @ts-expect-error - modalities not yet in OpenAI types but supported by gateway
  modalities: ['text', 'image'],
  stream: false,
});
 
const message = completion.choices[0].message;
 
// Text content is always a string
console.log('Text:', message.content);
 
// Images are in a separate array
if (message.images && Array.isArray(message.images)) {
  console.log(`Generated ${message.images.length} images:`);
  for (const [index, img] of message.images.entries()) {
    if (img.type === 'image_url' && img.image_url) {
      console.log(`Image ${index + 1}:`, {
        size: img.image_url.url?.length || 0,
        preview: `${img.image_url.url?.substring(0, 50)}...`,
      });
    }
  }
}
```

```
import os
from openai import OpenAI
 
api_key = os.getenv('AI_GATEWAY_API_KEY') or os.getenv('VERCEL_OIDC_TOKEN')
 
client = OpenAI(
    api_key=api_key,
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
completion = client.chat.completions.create(
    model='google/gemini-2.5-flash-image-preview',
    messages=[
        {
            'role': 'user',
            'content': 'Generate a beautiful sunset over mountains and describe the scene.'
        }
    ],
    # Note: modalities parameter is not yet in OpenAI Python types but supported by our gateway
    extra_body={'modalities': ['text', 'image']},
    stream=False,
)
 
message = completion.choices[0].message
 
# Text content is always a string
print(f"Text: {message.content}")
 
# Images are in a separate array
if hasattr(message, 'images') and message.images:
    print(f"Generated {len(message.images)} images:")
    for i, img in enumerate(message.images):
        if img.get('type') == 'image_url' and img.get('image_url'):
            image_url = img['image_url']['url']
            data_size = len(image_url) if image_url else 0
            print(f"Image {i+1}: size: {data_size} chars")
            print(f"Preview: {image_url[:50]}...")
 
print(f'Tokens used: {completion.usage}')
```

Response format

When image generation is enabled, the response separates text content from generated images:

```
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "google/gemini-2.5-flash-image-preview",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Here's a beautiful sunset scene over the mountains...",
        "images": [
          {
            "type": "image_url",
            "image_url": {
              "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
            }
          }
        ]
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 28,
    "total_tokens": 43
  }
}
```

### [Response structure details](#response-structure-details)

*   `content`: Contains the text description as a string
*   `images`: Array of generated images, each with:
    *   `type`: Always `"image_url"`
    *   `image_url.url`: Base64-encoded data URI of the generated image

### [Streaming responses](#streaming-responses)

For streaming requests, images are delivered in delta chunks:

```
{
  "id": "chatcmpl-123",
  "object": "chat.completion.chunk",
  "created": 1677652288,
  "model": "google/gemini-2.5-flash-image-preview",
  "choices": [
    {
      "index": 0,
      "delta": {
        "images": [
          {
            "type": "image_url",
            "image_url": {
              "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
            }
          }
        ]
      },
      "finish_reason": null
    }
  ]
}
```

### [Handling streaming image responses](#handling-streaming-image-responses)

When processing streaming responses, check for both text content and images in each delta:

TypeScriptPython

```
import OpenAI from 'openai';
 
const openai = new OpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const stream = await openai.chat.completions.create({
  model: 'google/gemini-2.5-flash-image-preview',
  messages: [{ role: 'user', content: 'Generate a sunset image' }],
  // @ts-expect-error - modalities not yet in OpenAI types
  modalities: ['text', 'image'],
  stream: true,
});
 
for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta;
 
  // Handle text content
  if (delta?.content) {
    process.stdout.write(delta.content);
  }
 
  // Handle images
  if (delta?.images) {
    for (const img of delta.images) {
      if (img.type === 'image_url' && img.image_url) {
        console.log(`\n[Image received: ${img.image_url.url.length} chars]`);
      }
    }
  }
}
```

```
import os
from openai import OpenAI
 
client = OpenAI(
    api_key=os.getenv('AI_GATEWAY_API_KEY'),
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
stream = client.chat.completions.create(
    model='google/gemini-2.5-flash-image-preview',
    messages=[{'role': 'user', 'content': 'Generate a sunset image'}],
    extra_body={'modalities': ['text', 'image']},
    stream=True,
)
 
for chunk in stream:
    if chunk.choices and chunk.choices[0].delta:
        delta = chunk.choices[0].delta
 
        # Handle text content
        if hasattr(delta, 'content') and delta.content:
            print(delta.content, end='', flush=True)
 
        # Handle images
        if hasattr(delta, 'images') and delta.images:
            for img in delta.images:
                if img.get('type') == 'image_url' and img.get('image_url'):
                    image_url = img['image_url']['url']
                    print(f"\n[Image received: {len(image_url)} chars]")
```

Image generation support: Currently, image generation is supported by Google's Gemini 2.5 Flash Image model. The generated images are returned as base64-encoded data URIs in the response. For more detailed information about image generation capabilities, see the [Image Generation documentation](/docs/ai-gateway/image-generation).

## [Embeddings](#embeddings)

Generate vector embeddings from input text for semantic search, similarity matching, and retrieval-augmented generation (RAG).

Endpoint

`POST /v1/embeddings`

Example request

```
import OpenAI from 'openai';
 
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const response = await openai.embeddings.create({
  model: 'openai/text-embedding-3-small',
  input: 'Sunny day at the beach',
});
 
console.log(response.data[0].embedding);
```

```
import os
from openai import OpenAI
 
api_key = os.getenv("AI_GATEWAY_API_KEY") or os.getenv("VERCEL_OIDC_TOKEN")
 
client = OpenAI(
    api_key=api_key,
    base_url="https://ai-gateway.vercel.sh/v1",
)
 
response = client.embeddings.create(
    model="openai/text-embedding-3-small",
    input="Sunny day at the beach",
)
 
print(response.data[0].embedding)
```

Response format

```
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "index": 0,
      "embedding": [-0.0038, 0.021, ...]
    },
  ],
  "model": "openai/text-embedding-3-small",
  "usage": {
    "prompt_tokens": 6,
    "total_tokens": 6
  },
  "providerMetadata": {
    "gateway": {
      "routing": { ... }, // Detailed routing info
      "cost": "0.00000012"
    }
  }
}
```

Dimensions parameter

You can set the root-level `dimensions` field (from the [OpenAI Embeddings API spec](https://platform.openai.com/docs/api-reference/embeddings/create)) and the gateway will auto-map it to each provider’s expected field; `providerOptions.[provider]` still passes through as-is and isn’t required for `dimensions` to work.

```
const response = await openai.embeddings.create({
  model: 'openai/text-embedding-3-small',
  input: 'Sunny day at the beach',
  dimensions: 768,
});
```

## [Credits](#credits)

Check your AI Gateway credit balance and usage information.

Endpoint

`GET /v1/credits`

Example request

```
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const response = await fetch('https://ai-gateway.vercel.sh/v1/credits', {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
});
 
const credits = await response.json();
console.log(credits);
```

```
import os
import requests
 
api_key = os.getenv("AI_GATEWAY_API_KEY") or os.getenv("VERCEL_OIDC_TOKEN")
 
response = requests.get(
    "https://ai-gateway.vercel.sh/v1/credits",
    headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    },
)
 
credits = response.json()
print(credits)
```

Response format

```
{
  "balance": "95.50",
  "total_used": "4.50"
}
```

## [Error handling](#error-handling)

The API returns standard HTTP status codes and error responses:

### [Common error codes](#common-error-codes)

*   `400 Bad Request`: Invalid request parameters
*   `401 Unauthorized`: Invalid or missing authentication
*   `403 Forbidden`: Insufficient permissions
*   `404 Not Found`: Model or endpoint not found
*   `429 Too Many Requests`: Rate limit exceeded
*   `500 Internal Server Error`: Server error

### [Error response format](#error-response-format)

```
{
  "error": {
    "message": "Invalid request: missing required parameter 'model'",
    "type": "invalid_request_error",
    "param": "model",
    "code": "missing_parameter"
  }
}
```

## [Direct REST API usage](#direct-rest-api-usage)

If you prefer to use the AI Gateway API directly without the OpenAI client libraries, you can make HTTP requests using any HTTP client. Here are examples using `curl` and JavaScript's `fetch` API:

### [List models](#list-models)

```
curl -X GET "https://ai-gateway.vercel.sh/v1/models" \
  -H "Authorization: Bearer $AI_GATEWAY_API_KEY" \
  -H "Content-Type: application/json"
```

```
const response = await fetch('https://ai-gateway.vercel.sh/v1/models', {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
    'Content-Type': 'application/json',
  },
});
 
const models = await response.json();
console.log(models);
```

### [Basic chat completion](#basic-chat-completion)

```
curl -X POST "https://ai-gateway.vercel.sh/v1/chat/completions" \
  -H "Authorization: Bearer $AI_GATEWAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4",
    "messages": [
      {
        "role": "user",
        "content": "Write a one-sentence bedtime story about a unicorn."
      }
    ],
    "stream": false
  }'
```

```
const response = await fetch(
  'https://ai-gateway.vercel.sh/v1/chat/completions',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        {
          role: 'user',
          content: 'Write a one-sentence bedtime story about a unicorn.',
        },
      ],
      stream: false,
    }),
  },
);
 
const result = await response.json();
console.log(result);
```

### [Streaming chat completion](#streaming-chat-completion)

```
curl -X POST "https://ai-gateway.vercel.sh/v1/chat/completions" \
  -H "Authorization: Bearer $AI_GATEWAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4",
    "messages": [
      {
        "role": "user",
        "content": "Write a one-sentence bedtime story about a unicorn."
      }
    ],
    "stream": true
  }' \
  --no-buffer
```

```
const response = await fetch(
  'https://ai-gateway.vercel.sh/v1/chat/completions',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        {
          role: 'user',
          content: 'Write a one-sentence bedtime story about a unicorn.',
        },
      ],
      stream: true,
    }),
  },
);
 
const reader = response.body.getReader();
const decoder = new TextDecoder();
 
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
 
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
 
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') {
        console.log('Stream complete');
        break;
      } else if (data.trim()) {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          process.stdout.write(content);
        }
      }
    }
  }
}
```

### [Image analysis](#image-analysis)

```
# First, convert your image to base64
IMAGE_BASE64=$(base64 -i ./path/to/image.png)
 
curl -X POST "https://ai-gateway.vercel.sh/v1/chat/completions" \
  -H "Authorization: Bearer $AI_GATEWAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "Describe this image in detail."
          },
          {
            "type": "image_url",
            "image_url": {
              "url": "data:image/png;base64,'"$IMAGE_BASE64"'",
              "detail": "auto"
            }
          }
        ]
      }
    ],
    "stream": false
  }'
```

```
import fs from 'node:fs';
 
// Read the image file as base64
const imageBuffer = fs.readFileSync('./path/to/image.png');
const imageBase64 = imageBuffer.toString('base64');
 
const response = await fetch(
  'https://ai-gateway.vercel.sh/v1/chat/completions',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Describe this image in detail.' },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${imageBase64}`,
                detail: 'auto',
              },
            },
          ],
        },
      ],
      stream: false,
    }),
  },
);
 
const result = await response.json();
console.log(result);
```

### [Tool calls](#tool-calls)

```
curl -X POST "https://ai-gateway.vercel.sh/v1/chat/completions" \
  -H "Authorization: Bearer $AI_GATEWAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4",
    "messages": [
      {
        "role": "user",
        "content": "What is the weather like in San Francisco?"
      }
    ],
    "tools": [
      {
        "type": "function",
        "function": {
          "name": "get_weather",
          "description": "Get the current weather in a given location",
          "parameters": {
            "type": "object",
            "properties": {
              "location": {
                "type": "string",
                "description": "The city and state, e.g. San Francisco, CA"
              },
              "unit": {
                "type": "string",
                "enum": ["celsius", "fahrenheit"],
                "description": "The unit for temperature"
              }
            },
            "required": ["location"]
          }
        }
      }
    ],
    "tool_choice": "auto",
    "stream": false
  }'
```

```
const response = await fetch(
  'https://ai-gateway.vercel.sh/v1/chat/completions',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        {
          role: 'user',
          content: 'What is the weather like in San Francisco?',
        },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'get_weather',
            description: 'Get the current weather in a given location',
            parameters: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  description: 'The city and state, e.g. San Francisco, CA',
                },
                unit: {
                  type: 'string',
                  enum: ['celsius', 'fahrenheit'],
                  description: 'The unit for temperature',
                },
              },
              required: ['location'],
            },
          },
        },
      ],
      tool_choice: 'auto',
      stream: false,
    }),
  },
);
 
const result = await response.json();
console.log(result);
```

### [Provider options](#provider-options)

```
curl -X POST "https://ai-gateway.vercel.sh/v1/chat/completions" \
  -H "Authorization: Bearer $AI_GATEWAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4",
    "messages": [
      {
        "role": "user",
        "content": "Tell me the history of the San Francisco Mission-style burrito in two paragraphs."
      }
    ],
    "stream": false,
    "providerOptions": {
      "gateway": {
        "order": ["vertex", "anthropic"]
      }
    }
  }'
```

```
const response = await fetch(
  'https://ai-gateway.vercel.sh/v1/chat/completions',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        {
          role: 'user',
          content:
            'Tell me the history of the San Francisco Mission-style burrito in two paragraphs.',
        },
      ],
      stream: false,
      providerOptions: {
        gateway: {
          order: ['vertex', 'anthropic'], // Try Vertex AI first, then Anthropic
        },
      },
    }),
  },
);
 
const result = await response.json();
console.log(result);
```