from playwright.sync_api import sync_playwright, expect

def test_dashboard(page):
    page.on("console", lambda msg: print(f"Console: {msg.text}"))
    page.on("pageerror", lambda err: print(f"Page Error: {err}"))

    try:
        print("Navigating to dashboard...")
        page.goto("http://localhost:3000")

        # Wait a bit
        page.wait_for_timeout(2000)

        print("Page Content:")
        print(page.content())

        print("Waiting for 'Total Processed'...")
        # Wait for the dashboard content to appear
        expect(page.get_by_text("Total Processed")).to_be_visible(timeout=5000)

        # Check if the table headers are visible
        expect(page.get_by_text("Mesa ID")).to_be_visible()

        # Take a screenshot
        page.screenshot(path="verification/dashboard.png")
    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/dashboard_error.png")
        raise e

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_dashboard(page)
        finally:
            browser.close()
