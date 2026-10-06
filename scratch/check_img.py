from PIL import Image

im = Image.open('C:/Users/ashut/.gemini/antigravity-ide/brain/2c9b5ae3-b1e7-4970-84f2-9608d1abaea1/.user_uploaded/media_1791120638439.jpg')
for x in range(0, im.width, 50):
    p = im.getpixel((x, 60))
    print(f'x={x}: rgb={p[:3]}')
