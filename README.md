# Eyetracking Studio
The Eyetracking Studio is a browser-based implementation of an eyetracking visualization software. It's purpose is to make various visualization techniques easily accessible to the user. Data selection and settings are realized through a simple UI. It is based on a Python server and Javascript visualization. 

## Getting started
* To run the Python ajaxHandler `psycopg2` is needed. 
* Images and the respective gazedata files have to be stored in the `data/` folder. Gazedata files need to be in *csv format*, image files in *png-* or *jpg format*. To maintain mapping of images and gazedata, the csv files must be named like the image, followed by an underscore and a number, e.g. `exampleimage.jpg` and `exampleimage_01.csv`.
* Run the software by starting `main.py` and opening `localhost:8080` in the web browser.
