import cv2 
import mediapipe as mp

wc  = cv2.VideoCapture(0)

# Initialize Face Detection once, not in the loop
with mp.solutions.face_detection.FaceDetection(model_selection=0, min_detection_confidence=0.5) as face_det:

    while True:
        ret, img = wc.read()
        if not ret:
            print("Failed to capture frame")
            break  # Exit the loop if there's no valid frame

        H, W, C = img.shape
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        out = face_det.process(img_rgb)

        if out.detections:
            for det in out.detections:
                bbox = det.location_data.relative_bounding_box
                xmin = max(0, int(bbox.xmin * W))
                ymin = max(0, int(bbox.ymin * H))
                w = min(W - xmin, int(bbox.width * W))
                h = min(H - ymin, int(bbox.height * H))

                # Check if bounding box has a valid size before applying blur
                if w > 0 and h > 0:
                    img[ymin:ymin+h, xmin:xmin+w, :] = cv2.blur(img[ymin:ymin+h, xmin:xmin+w, :], (30, 30))

        cv2.imshow('img', img)
        if cv2.waitKey(40) & 0xFF == ord('q'):
            break

wc.release()
cv2.destroyAllWindows()
