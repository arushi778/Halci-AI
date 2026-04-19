import asyncio
import traceback
from services.risk_scorer import score_prompt
from services.llm_clients import generate_response

async def main():
    try:
        print('Testing score_prompt...')
        res1 = await score_prompt('test')
        print(res1)
        
        print('Testing generate...')
        res2 = await generate_response('test')
        print(res2)
    except Exception as e:
        traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(main())
