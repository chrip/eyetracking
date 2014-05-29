import csv
import json
import ajaxHandler
import base64
import os
from PIL import Image


def prepareGazeData(filename, data):

	#check whether the gazedata is already encoded, if yes do nothing
	if not os.path.isfile(filename+"_gazedata.html"):
		datafile = open(filename+'_gazedata.html', 'w')
		datafile.write(data)
		datafile.close()
	
	
def prepareImage(filename):
	
	#check whether the image is already encoded, if yes do nothing
	if not os.path.isfile(filename.partition(".")[0]+"_imagedata.html"):
			with open(filename, 'rb') as image_file:
				encoded_string = json.dumps(base64.b64encode(image_file.read()))
				
				# write image code into .html-file (no .json file possible due to ajaxHandler)
				imagefile = open(filename.partition(".")[0]+'_imagedata.html', 'w')
				imagefile.write(encoded_string)
				imagefile.close()

		
# search for relevant files in directory
def listFiles():

	csvfiles = []
	imagefiles = []
	
	# get current path
	currentpath = os.path.dirname(os.path.abspath(__file__))
	for file in os.listdir(currentpath + "/data"):
		if file.endswith(".csv"):
			csvfiles.append(file)
		if file.endswith(".jpg") or file.endswith(".png"):
			imagefiles.append(file)
			
	content = "{\'selectiondata\':["
			
	# find pairs		
	for csvfile in csvfiles:
		for imagefile in imagefiles:
			if (csvfile.partition(".")[0] == imagefile.partition(".")[0]):
				f = csvfile.partition(".")[0]
				
				# on startup create html files for all possible files to prepare request from server
				prepareImage("data/"+imagefile);
				prepareGazeData("data/"+f, extractCSVData("data/"+csvfile));
				
				# get image dimensions
				img = Image.open("data/"+imagefile)
				width, height = img.size
				
				content += "{\'name\':\'" + f + "\', type:\'" + imagefile.partition(".")[2] + "\', width:\'" + str(width) + "\', height:\'" + str(height) + "\'},"
				
	content += "]}"
	
	selectionfile = open('selectiondata.html', 'w')
	selectionfile.write(content)
	selectionfile.close()
	
	#print content
			

def extractCSVData(filename):

	csvFile = open(filename, 'rb')
	reader = csv.reader(csvFile)
	
	# string to create json object
	completeList = "{\'gazedata\':[" 
	
	rownum = 0
	for row in reader:
		# save header row
		if rownum == 0:
			header = row
		else:
			colnum = 0
			
			completeList += "{"

			for col in row:
				# select relevant data and save it to separate lists
			
				# fixation x coordinate
				if header[colnum] == "FixationPointX (MCSpx)":
					completeList += "\'fx\':" + col + ","
				# fixation y coordinate	
				elif header[colnum] == "FixationPointY (MCSpx)":
					completeList += "\'fy\':" + col + "}, "
				# gaze duration	
				elif header[colnum] == "GazeEventDuration":
					completeList += "\'gd\':" + col + ","
				# fixation index
				elif header[colnum] == "FixationIndex":
					completeList += "\'fi\':" + col + ","
				
				colnum += 1
			
		rownum += 1		
		
	completeList += "]}"

	csvFile.close()

	return completeList
	
		
# get possible files
listFiles()	
	
#read filename
#x = raw_input("Dateiname: ")

# save serialized data
#data = extractCSVData(str("data/"+x))
#prepareGazeData(data)

# prepare image for ajax request from browser
#prepareImage(str("data/"+x))

# debugging output
#print data

ajaxHandler.start_server()
