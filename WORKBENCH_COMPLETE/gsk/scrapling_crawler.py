import asyncio
from scrapling import Adaptor

async def main():
    # Target a simple, reliable site for testing
    url = "https://httpbin.org/html"
    
    # Create adaptor and fetch page
    adaptor = Adaptor()
    page = await adaptor.get(url)
    
    # Extract structured data
    title = page.css_first('title').text if page.css_first('title') else 'No title'
    h1 = page.css_first('h1').text if page.css_first('h1') else 'No h1'
    
    result = {
        "url": url,
        "title": title,
        "heading": h1,
        "status": "success"
    }
    
    print(result)
    return result

if __name__ == "__main__":
    asyncio.run(main())