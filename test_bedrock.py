import os
import sys

os.environ['OPENAI_API_KEY'] = 'bedrock-api-key-YmVkcm9jay5hbWF6b25hd3MuY29tLz9BY3Rpb249Q2FsbFdpdGhCZWFyZXJUb2tlbiZYLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFTSUFaQ1oyWkI2M1JGQkw3SURUJTJGMjAyNjA4MTIlMkZ1cy1lYXN0LTElMkZiZWRyb2NrJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNjA4MTJUMjEyMTIyWiZYLUFtei1FeHBpcmVzPTQzMjAwJlgtQW16LVNlY3VyaXR5LVRva2VuPUlRb0piM0pwWjJsdVgyVmpFQTRhQ1hWekxXVmhjM1F0TVNKSE1FVUNJUUM0S3E2JTJGdWpUZ2dYJTJGUlJ6MkNCdkRZYnRwRE9pQ0x6NjFkb1Y5VVhYVVdmd0lnYnpuU0ZCQklOR3R3UWdsY1BySU8lMkY2aERPSlVoZGU3OFBJY3FzSHhQUiUyRmtxcmdNSTF2JTJGJTJGJTJGJTJGJTJGJTJGJTJGJTJGJTJGJTJGQVJBQUdndzJNalExTURReE5EYzRPVFVpRERiRWsxbCUyRktaOXpOM3pJOHlxQ0E4WlZ5Q3JIR2FJeUJMN3lPakJoSTZhcmFycENaTXlXaFpkRU13VUtiWDlIZFZBV0NDdHFqeWJrczlNUnIlMkZUOVo4TEM2dE1rJTJGeHdKViUyRlRFaE1TT0RldDlBeGVHMU1tMnVhdHpoYWhqN0d4TlBFcTcxM2hOTkVrcjJRQ2MxRXV1MFNXUnJUNjN1UFBSdkdBbzNySVlSNiUyRmVOUXRsR0thSVQyaGtKd1RCZjQwTE5FM0dYM3BZMFkyU2VCTVBTSWxRTzd3clRPb05VNTl1cUJFRjlHNndsUlVmTSUyQldKbUZ3RjdOY2VqQXR6UWh3U3ZSZXBtRUQ0WmFPcE1aeG00clZ0N0NUY3pGT2ZpOHloYldKSTdtZWVUVGpjSjI3RzdEMDVER01MNUsxemF4d0NPQjJNYlJ2T0slMkI0V3J1MXRBS0dHaEJ1VHZuMUg4NHMwaDNGdGFGWiUyQktjVGpQUWFRbm1TTkQwQ3ZoNTBjcEZPRFlaTURuQWF4akllQlJndk5CbG15Q01tUUNoM3V0OFElMkZnRDl4aiUyRk1yVFV0d3I4WVlHYlRjQUYxV1RKb1BDTGIwZ0ZQSmYlMkZZSzBiJTJCazFtOEpRVW9QSVVJVXVqaERIcWdqSUNzekVrYklFRHlSSlpydUJ0VXdTJTJGcHY2dmhibHJaOWJvT0N6MUNxekwzZTIxRHhzUFFUSzklMkJsTU5HJTJCODlNR090NENCRWJZSjlnaGlJbzA0VUFtJTJGbzRoRERHa2hVR2Q3MWcwemY4ZjhiZUx6cXNpbkIlMkI4WlBxTFluQk8xbXFhTWFEYjM2NzhWOG5YY1JBU3FRbGhEaU5Jam5ya2RjbzNrTDk4Q2VCZjE5TXNlcVVqSXlkcDRwcnQxMldwak1wSWRwNXZJY213V0FxRlI3QkJMRUIwSGJXUEFOMlhyUkZrejJTalNYcCUyQjJreGVGN3A4NnhvZ2ZzbGNyalJJcGlJRjhLSmYxd3FwZ1lwcyUyRjJ0MmFwQllldTdpNk5mM3lqZ29YcEdyRHMxeUxlZkZlNUhwUm1RbUlTeGNNSmJaR2kxYUZmR09mV1JvekRPZ0g1YmtpYmZvSm9yN2dOSjBvMiUyQmFIeUNYcTJOVVFLRFZNa1NVMmpKaWNxNW5lc3YwZzdjZGhRZGs1SThEOHllZGVPQU1lS1R5WVFqJTJGYURsTEtoZUslMkY0ZCUyQkkyWDVldklENyUyRkxZbFZQTHczSzhWY3F6dWppcDVBWE9iZ29hRjR4QlV6U0l5YyUyQlNPeVlIJTJGaFk5SkJ6JTJCazJqalVreGlJdTRhbkZmbDh0NTRseUd6SSUyRlh2cTUxS2hkOFJoS0RtNDFCYlY2alB5UGFSRmo4JTNEJlgtQW16LVNpZ25hdHVyZT0zODA1MTk2MzVhYzJlNjU1ZmJiZWQwNDhjYTViYmVlMWFkM2FmYmYzNmY3YTRhNzdiMjQ0MWI1OWY3N2IzYmU1JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZWZXJzaW9uPTE='
os.environ['OPENAI_BASE_URL'] = 'https://bedrock-mantle.us-east-1.api.aws/v1'

from openai import OpenAI

client = OpenAI(
    api_key=os.environ.get('OPENAI_API_KEY'),
    base_url=os.environ.get('OPENAI_BASE_URL')
)

print('Trying openai.gpt-oss-120b...')
stream = client.responses.create(
    model='openai.gpt-oss-120b',
    input=[
        {'role': 'user', 'content': 'Tell me a short story about a robot.'}
    ],
    stream=False
)

# Extract text from response - handle unicode properly
result_text = ''
if hasattr(stream, 'output') and stream.output:
    for item in stream.output:
        if hasattr(item, 'text') and item.text:
            result_text += item.text
        elif hasattr(item, 'content') and item.content:
            if isinstance(item.content, list):
                for c in item.content:
                    if hasattr(c, 'text'):
                        result_text += c.text
            elif hasattr(item.content, 'text'):
                result_text += item.content.text

# Write to file to avoid unicode console issues
with open('bedrock_result.txt', 'w', encoding='utf-8') as f:
    f.write(result_text if result_text else 'No text extracted')

print(f'Result written to bedrock_result.txt')
print(f'Length: {len(result_text)} chars')
print(f'Preview: {result_text[:200] if result_text else "None"}')