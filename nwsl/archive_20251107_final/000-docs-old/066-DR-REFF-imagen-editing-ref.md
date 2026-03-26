# Imagen Editing

Imagen editing is done via the "imagen-3.0-capability-001" model.


## Capabilities


### Inpainting insert - text

In these examples you will specify a targeted area to apply edits to. In the case of inpainting insert, you'll use a mask area to add image content to an existing image. Start by generating an image using Imagen 3. Then create two ReferenceImage objects, one for your reference image and one for your mask. For the MaskReferenceImage set reference_image=None, this will allow for automatic mask detection based on the specified mask_mode.

When generating images you can also set the safety_filter_level and person_generation parameters accordingly:

* person_generation: DONT_ALLOW, ALLOW_ADULT, ALLOW_ALL
* safety_filter_level: BLOCK_LOW_AND_ABOVE, BLOCK_MEDIUM_AND_ABOVE, BLOCK_ONLY_HIGH, BLOCK_NONE

#### Python example

```python
image_prompt = """
a small wooden bowl with grapes and apples on a marble kitchen counter, light brown cabinets blurred in the background
"""
generated_image = client.models.generate_images(
    model=generation_model,
    prompt=image_prompt,
    config=GenerateImagesConfig(
        number_of_images=1,
        aspect_ratio="1:1",
        safety_filter_level="BLOCK_MEDIUM_AND_ABOVE",
        person_generation="DONT_ALLOW",
    ),
)

edit_prompt = "a small white ceramic bowl with lemons and limes"
raw_ref_image = RawReferenceImage(
    reference_image=generated_image.generated_images[0].image, reference_id=0
)
mask_ref_image = MaskReferenceImage(
    reference_id=1,
    reference_image=None,
    config=MaskReferenceConfig(
        mask_mode="MASK_MODE_FOREGROUND",
        mask_dilation=0.1,
    ),
)
edited_image = client.models.edit_image(
    model=edit_model,
    prompt=edit_prompt,
    reference_images=[raw_ref_image, mask_ref_image],
    config=EditImageConfig(
        edit_mode="EDIT_MODE_INPAINT_INSERTION",
        number_of_images=1,
        safety_filter_level="BLOCK_MEDIUM_AND_ABOVE",
        person_generation="ALLOW_ADULT",
    ),
)
```

### Inpainting insert - semantic mask mode

This next example demonstrates another instance of inpainting insert. However, you'll use the semantic mask mode. When using this mask mode, you'll need to specify the class ID of the object in the image that you wish to mask and replace. A list of possible instance types is shown at the end of this notebook. Once you've found the correct segmentation class ID, list it in segmentation_classes.

Within the MaskReferenceImage object you can also configure the dilation value. This float between 0 and 1 represents the percentage of the provided mask.

```python
image_prompt = """
a french bulldog sitting in a living room on a couch with green throw pillows and a throw blanket,
a circular mirror is on the wall above the couch
"""
generated_image = client.models.generate_images(
    model=generation_model,
    prompt=image_prompt,
    config=GenerateImagesConfig(
        number_of_images=1,
        aspect_ratio="1:1",
        safety_filter_level="BLOCK_MEDIUM_AND_ABOVE",
        person_generation="DONT_ALLOW",
    ),
)

edit_prompt = "a corgi sitting on a couch"
raw_ref_image = RawReferenceImage(
    reference_image=generated_image.generated_images[0].image, reference_id=0
)
mask_ref_image = MaskReferenceImage(
    reference_id=1,
    reference_image=None,
    config=MaskReferenceConfig(
        mask_mode="MASK_MODE_SEMANTIC",
        segmentation_classes=[8],
        mask_dilation=0.1,
    ),
)
edited_image = client.models.edit_image(
    model=edit_model,
    prompt=edit_prompt,
    reference_images=[raw_ref_image, mask_ref_image],
    config=EditImageConfig(
        edit_mode="EDIT_MODE_INPAINT_INSERTION",
        number_of_images=1,
        safety_filter_level="BLOCK_MEDIUM_AND_ABOVE",
        person_generation="ALLOW_ADULT",
    ),
)
```

### Inpainting Remove

Inpainting remove allows you to use a mask area to remove image content.

In this next example, you'll take an image in Google Cloud Storage of a wall with a mirror and some photos and create a mask over detected mirror instances. You'll then remove this object by setting the edit mode to "EDIT_MODE_INPAINT_REMOVAL." For these types of requests the prompt can be an empty string.


```python
starting_image = Image(gcs_uri="gs://cloud-samples-data/generative-ai/image/mirror.png")
raw_ref_image = RawReferenceImage(reference_image=starting_image, reference_id=0)
mask_ref_image = MaskReferenceImage(
    reference_id=1,
    reference_image=None,
    config=MaskReferenceConfig(
        mask_mode="MASK_MODE_SEMANTIC", segmentation_classes=[85]
    ),
)

remove_image = client.models.edit_image(
    model=edit_model,
    prompt="",
    reference_images=[raw_ref_image, mask_ref_image],
    config=EditImageConfig(
        edit_mode="EDIT_MODE_INPAINT_REMOVAL",
        number_of_images=1,
        safety_filter_level="BLOCK_MEDIUM_AND_ABOVE",
        person_generation="ALLOW_ADULT",
    ),
)
```

### Product background editing via background swap mode
You can also use Imagen 3 for product image editing. By setting edit_mode to "EDIT_MODE_BGSWAP", you can maintain the product content while modifying the image background.

For this example, start with an image stored in a Google Cloud Storage bucket, and provide a prompt describing the new background scene.


```python
product_image = Image(
    gcs_uri="gs://cloud-samples-data/generative-ai/image/suitcase.png"
)
raw_ref_image = RawReferenceImage(reference_image=product_image, reference_id=0)
mask_ref_image = MaskReferenceImage(
    reference_id=1,
    reference_image=None,
    config=MaskReferenceConfig(mask_mode="MASK_MODE_BACKGROUND"),
)

prompt = "a light blue suitcase in front of a window in an airport, lots of bright, natural lighting coming in from the windows, planes taking off in the distance"
edited_image = client.models.edit_image(
    model=edit_model,
    prompt=prompt,
    reference_images=[raw_ref_image, mask_ref_image],
    config=EditImageConfig(
        edit_mode="EDIT_MODE_BGSWAP",
        number_of_images=1,
        seed=1,
        safety_filter_level="BLOCK_MEDIUM_AND_ABOVE",
        person_generation="ALLOW_ADULT",
    ),
)
```

### Outpainting
Imagen 3 editing can be used for image outpainting. Outpainting is used to expand the content of an image to a larger area or area with different dimensions. To use the outpainting feature, you must create an image mask and prepare the original image by padding some empty space around it. Once you've padded the image, you can use the outpainting editing mode to fill in the empty space.

```python
prompt = "a chandelier hanging from the ceiling"
edited_image = client.models.edit_image(
    model=edit_model,
    prompt=prompt,
    reference_images=[raw_ref_image, mask_ref_image],
    config=EditImageConfig(
        edit_mode="EDIT_MODE_OUTPAINT",
        number_of_images=1,
        safety_filter_level="BLOCK_MEDIUM_AND_ABOVE",
        person_generation="ALLOW_ADULT",
    ),
)
```

### Mask-free editing
Imagen 3 editing also lets you edit images without a mask. Simply write the changes you wish to make to the image in the prompt and provide the original image as the sole reference image.

```python
original_image = Image(gcs_uri="gs://cloud-samples-data/generative-ai/image/latte.jpg")
raw_ref_image = RawReferenceImage(reference_image=original_image, reference_id=0)


prompt = "swan latte art in the coffee cup and an assortment of red velvet cupcakes in gold wrappers on the white plate"
edited_image = client.models.edit_image(
    model=edit_model,
    prompt=prompt,
    reference_images=[raw_ref_image],
    config=EditImageConfig(
        edit_mode="EDIT_MODE_DEFAULT",
        number_of_images=1,
        safety_filter_level="BLOCK_MEDIUM_AND_ABOVE",
        person_generation="ALLOW_ADULT",
    ),
)
```

### Few-shot customization

The Imagen API lets you create high quality images in seconds, using text prompts and reference images to guide subject or style generation.

```json
{
  "instances": [
    {
      "prompt": "Create an image about a man with short hair [1] in the pose of
       control image [2] to match the description: A pencil style sketch of a
       full-body portrait of a man with short hair [1] with hatch-cross drawing,
       hatch drawing of portrait with 6B and graphite pencils, white background,
       pencil drawing, high quality, pencil stroke, looking at camera, natural
       human eyes",
      "referenceImages": [
        {
          "referenceType": "REFERENCE_TYPE_CONTROL",
          "referenceId": 2,
          "referenceImage": {
            "bytesBase64Encoded": "${IMAGE_BYTES_1}"
          },
          "controlImageConfig": {
            "controlType": "CONTROL_TYPE_FACE_MESH",
            "enableControlImageComputation": true
          }
        },
        {
          "referenceType": "REFERENCE_TYPE_SUBJECT",
          "referenceId": 1,
          "referenceImage": {
            "bytesBase64Encoded": "${IMAGE_BYTES_2}"
          },
          "subjectImageConfig": {
            "subjectDescription": "a man with short hair",
            "subjectType": "SUBJECT_TYPE_PERSON"
          }
        },
        {
          "referenceType": "REFERENCE_TYPE_SUBJECT",
          "referenceId": 1,
          "referenceImage": {
            "bytesBase64Encoded": "${IMAGE_BYTES_3}"
          },
          "subjectImageConfig": {
            "subjectDescription": "a man with short hair",
            "subjectType": "SUBJECT_TYPE_PERSON"
          }
        },
        {
          "referenceType": "REFERENCE_TYPE_SUBJECT",
          "referenceId": 1,
          "referenceImage": {
            "bytesBase64Encoded": "${IMAGE_BYTES_4}"
          },
          "subjectImageConfig": {
            "subjectDescription": "a man with short hair",
            "subjectType": "SUBJECT_TYPE_PERSON"
          }
        }
      ]
    }
  ],
  "parameters": {
    "negativePrompt": "wrinkles, noise, Low quality, dirty, low res, multi face,
      rough texture, messy, messy background, color background, photo realistic,
      photo, super realistic, signature, autograph, sign, text, characters,
      alphabet, letter",
    "seed": 1,
    "language": "en",
    "sampleCount": 4
  }
}
```

## Segmentation Class ID


Class IDs - Use the following object class IDs to automatically create an image mask based on specific objects.

```
Class ID (class_id)	Object
0	backpack
1	umbrella
2	bag
3	tie
4	suitcase
5	case
6	bird
7	cat
8	dog
9	horse
10	sheep
11	cow
12	elephant
13	bear
14	zebra
15	giraffe
16	animal (other)
17	microwave
18	radiator
19	oven
20	toaster
21	storage tank
22	conveyor belt
23	sink
24	refrigerator
25	washer dryer
26	fan
27	dishwasher
28	toilet
29	bathtub
30	shower
31	tunnel
32	bridge
33	pier wharf
34	tent
35	building
36	ceiling
37	laptop
38	keyboard
39	mouse
40	remote
41	cell phone
42	television
43	floor
44	stage
45	banana
46	apple
47	sandwich
48	orange
49	broccoli
50	carrot
51	hot dog
52	pizza
53	donut
54	cake
55	fruit (other)
56	food (other)
57	chair (other)
58	armchair
59	swivel chair
60	stool
61	seat
62	couch
63	trash can
64	potted plant
65	nightstand
66	bed
67	table
68	pool table
69	barrel
70	desk
71	ottoman
72	wardrobe
73	crib
74	basket
75	chest of drawers
76	bookshelf
77	counter (other)
78	bathroom counter
79	kitchen island
80	door
81	light (other)
82	lamp
83	sconce
84	chandelier
85	mirror
86	whiteboard
87	shelf
88	stairs
89	escalator
90	cabinet
91	fireplace
92	stove
93	arcade machine
94	gravel
95	platform
96	playingfield
97	railroad
98	road
99	snow
100	sidewalk pavement
101	runway
102	terrain
103	book
104	box
105	clock
106	vase
107	scissors
108	plaything (other)
109	teddy bear
110	hair dryer
111	toothbrush
112	painting
113	poster
114	bulletin board
115	bottle
116	cup
117	wine glass
118	knife
119	fork
120	spoon
121	bowl
122	tray
123	range hood
124	plate
125	person
126	rider (other)
127	bicyclist
128	motorcyclist
129	paper
130	streetlight
131	road barrier
132	mailbox
133	cctv camera
134	junction box
135	traffic sign
136	traffic light
137	fire hydrant
138	parking meter
139	bench
140	bike rack
141	billboard
142	sky
143	pole
144	fence
145	railing banister
146	guard rail
147	mountain hill
148	rock
149	frisbee
150	skis
151	snowboard
152	sports ball
153	kite
154	baseball bat
155	baseball glove
156	skateboard
157	surfboard
158	tennis racket
159	net
160	base
161	sculpture
162	column
163	fountain
164	awning
165	apparel
166	banner
167	flag
168	blanket
169	curtain (other)
170	shower curtain
171	pillow
172	towel
173	rug floormat
174	vegetation
175	bicycle
176	car
177	autorickshaw
178	motorcycle
179	airplane
180	bus
181	train
182	truck
183	trailer
184	boat ship
185	slow wheeled object
186	river lake
187	sea
188	water (other)
189	swimming pool
190	waterfall
191	wall
192	window
193	window blind
```


### Go Sample

From: https://raw.githubusercontent.com/googleapis/go-genai/refs/tags/v1.18.0/examples/models/edit_image/image.go



```go
// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

//go:build ignore_vet

package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"

	"google.golang.org/genai"
)

func print(r any) {
	// Marshal the result to JSON.
	response, err := json.MarshalIndent(r, "", "  ")
	if err != nil {
		log.Fatal(err)
	}
	// Log the output.
	fmt.Println(string(response))
}

func run(ctx context.Context) {
	client, err := genai.NewClient(ctx, nil)
	if err != nil {
		log.Fatal(err)
	}
	if client.ClientConfig().Backend == genai.BackendVertexAI {
		fmt.Println("Calling VertexAI Backend...")
	} else {
		fmt.Println("Calling GeminiAPI Backend...")
	}

	// Read the image data from a url.
	resp, err := http.Get("https://storage.googleapis.com/cloud-samples-data/generative-ai/image/scones.jpg")
	if err != nil {
		fmt.Println("Error fetching image:", err)
		return
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Edit image example. Only supported in BackendVertexAI.")
	rawRefImg := &genai.RawReferenceImage{
		ReferenceImage: &genai.Image{ImageBytes: data},
		ReferenceID:    1,
	}
	maskRefImg := &genai.MaskReferenceImage{
		ReferenceID: 2,
		Config: &genai.MaskReferenceConfig{
			MaskMode:     "MASK_MODE_BACKGROUND",
			MaskDilation: genai.Ptr[float32](0.0),
		},
	}
	response3, err := client.Models.EditImage(
		ctx, "imagen-3.0-capability-001",
		/*prompt=*/ "Sunlight and clear sky",
		[]genai.ReferenceImage{rawRefImg, maskRefImg},
		&genai.EditImageConfig{
			EditMode:         "EDIT_MODE_INPAINT_INSERTION",
			IncludeRAIReason: true,
			OutputMIMEType:   "image/jpeg",
		},
	)
	if err != nil {
		log.Fatal(err)
	}
	print(response3)
}

func main() {
	ctx := context.Background()
	flag.Parse()
	run(ctx)
}
```