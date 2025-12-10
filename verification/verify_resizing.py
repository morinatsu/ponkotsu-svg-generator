from playwright.sync_api import sync_playwright

def verify_resizing():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Go to app
            page.goto("http://localhost:5173")

            # Wait for modal title
            page.wait_for_selector("text=キャンバスサイズ設定")

            # Click Confirm button
            page.click("button:has-text('設定して開始')")

            # Draw a rectangle
            # Mouse down at 100,100
            page.mouse.move(100, 100)
            page.mouse.down()
            # Mouse move to 200,200
            page.mouse.move(200, 200)
            page.mouse.up()

            # Click the rectangle to select it.
            # Center is 150,150.
            page.mouse.click(150, 150)

            # Verify SE resize.
            # SE Corner is at 200,200.
            # Move mouse to 198,198 (inside the 10px radius).
            page.mouse.move(198, 198)

            # Drag to 250,250
            page.mouse.down()
            page.mouse.move(250, 250)
            page.mouse.up()

            # Take screenshot
            page.screenshot(path="verification/resize_verification.png")
            print("Screenshot taken")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_resizing()
