from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:5173/")
    page.wait_for_load_state("networkidle")

    # Get canvas
    canvas = page.locator('svg[width="800"]')

    # Select rectangle tool
    page.get_by_role("button", name="長方形").click()

    # Draw a rectangle
    canvas.bounding_box()
    canvas.drag_to(canvas, source_position={'x': 100, 'y': 100}, target_position={'x': 200, 'y': 200})

    # Select ellipse tool
    page.get_by_role("button", name="楕円").click()

    # Draw an ellipse
    canvas.drag_to(canvas, source_position={'x': 300, 'y': 300}, target_position={'x': 400, 'y': 400})

    # Try to select the rectangle by its center (should fail)
    canvas.click(position={'x': 150, 'y': 150})

    # Take a screenshot to show the rectangle is not selected
    page.screenshot(path="jules-scratch/verification/verification_1.png")

    # Select the rectangle by its border
    canvas.click(position={'x': 100, 'y': 150})

    # Take a screenshot to show the rectangle is selected
    page.screenshot(path="jules-scratch/verification/verification_2.png")

    # Try to select the ellipse by its center (should fail)
    canvas.click(position={'x': 350, 'y': 350})

    # Take a screenshot to show the ellipse is not selected
    page.screenshot(path="jules-scratch/verification/verification_3.png")

    # Select the ellipse by its border
    canvas.click(position={'x': 300, 'y': 350})

    # Take a screenshot to show the ellipse is selected
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)