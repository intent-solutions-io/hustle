# Selfie Camera Component

This component provides a simple UI to access a user's camera and capture a photo.

## Correct Usage Pattern

To use this component correctly and avoid common lifecycle issues, you **must** wrap it in a conditionally rendered dialog. This solves two critical problems:

1.  **The "Hidden but Active" Problem:** The camera should only activate when the user explicitly asks for it. By placing the component inside an `if state.show_dialog:` block, we ensure the `<selfie-camera>` element is only added to the DOM when the dialog is visible. If it were rendered while hidden (e.g., in a `dialog` with `is_open=False`), its `firstUpdated` method would fire on page load and immediately activate the camera, which is not the desired behavior.

2.  **The "Lingering Stream" Problem:** The browser's camera stream must be explicitly closed when it is no longer needed. This component has a `disconnectedCallback` that stops the camera tracks. This callback is only fired when the component is removed from the DOM. Our conditional rendering pattern ensures that when `state.show_dialog` becomes `False`, the component is removed, triggering this cleanup and deactivating the camera indicator.

### Example Implementation

Follow this pattern in your Mesop page to use the component safely.

**1. Add a boolean to your `PageState` to control the dialog:**

```python
@me.stateclass
class PageState:
    # ... other state variables
    show_selfie_dialog: bool = False
```

**2. Create a component to render the dialog:**

This component should only render the `selfie_camera` when the dialog is visible.

```python
from .components.selfie_camera.selfie_camera import selfie_camera

@me.component
def selfie_dialog():
    state = me.state(PageState)
    with dialog(is_open=state.show_selfie_dialog):
        # This `if` statement is critical for the component's lifecycle
        if state.show_selfie_dialog:
            with me.box(style=me.Style(padding=me.Padding.all(16))):
                me.text("Take a Selfie", type="headline-6")
                selfie_camera(on_capture=on_selfie_capture)
                with me.box(style=me.Style(display="flex", justify_content="flex-end", margin=me.Margin(top=16))):
                    me.button("Cancel", on_click=lambda e: setattr(state, "show_selfie_dialog", False), type="flat")
```

**3. Create the event handlers:**

One to open the dialog, and one to handle the captured image data.

```python
import base64
import uuid
from common.storage import store_to_gcs
from common.utils import create_display_url

def on_open_selfie_dialog(e: me.ClickEvent):
    state = me.state(PageState)
    state.show_selfie_dialog = True
    yield

def on_selfie_capture(e: me.WebEvent):
    state = me.state(PageState)
    state.show_selfie_dialog = False

    # The data is a base64-encoded data URL
    data_url = e.value["value"]
    try:
        header, encoded = data_url.split(",", 1)
        mime_type = header.split(";")[0].split(":")[1]
        image_data = base64.b64decode(encoded)

        gcs_uri = store_to_gcs(
            folder="selfies",
            file_name=f"selfie_{uuid.uuid4()}.png",
            mime_type=mime_type,
            contents=image_data,
        )

        # Update your page state with the new image URI
        state.reference_image_gcs = gcs_uri
        state.reference_image_display_url = create_display_url(gcs_uri)

    except Exception as ex:
        # Handle errors
        print(f"Failed to process selfie: {ex}")

    yield
```

**4. Add the dialog and a trigger to your main page content:**

```python
def my_page_content():
    # Add the dialog to your page's render tree
    selfie_dialog()

    # Add a button to trigger the dialog
    with me.content_button(type="icon", on_click=on_open_selfie_dialog):
        me.icon("camera_alt")
```
