import asyncio
from services.sentence_audit import audit_sentences

async def run():
    try:
        res = await audit_sentences("Space is very big. The moon is made of cheese.", [])
        print(res)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(run())
