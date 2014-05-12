import csv
import json
import ajaxHandler
import base64

def extractCSVData(filename):

	csvFile = open(filename +".csv", 'rb')
	reader = csv.reader(csvFile)
	
	# lists for extracted data from csv-file
	fixationXList = []
	fixationYList = []
	gazedurationList = []
	fixationIndexList = []
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
					fixationXList.append(int(col))
					completeList += "\'fx\':" + col + ","
				# fixation y coordinate	
				elif header[colnum] == "FixationPointY (MCSpx)":
					fixationYList.append(int(col))
					completeList += "\'fy\':" + col + "}, "
				# gaze duration	
				elif header[colnum] == "GazeEventDuration":
					gazedurationList.append(int(col))
					completeList += "\'gd\':" + col + ","
				# fixation index
				elif header[colnum] == "FixationIndex":
					fixationIndexList.append(int(col))
					completeList += "\'fi\':" + col + ","
				
				colnum += 1
			
		rownum += 1		
		
	completeList += "]}"

	csvFile.close()

	# serialize
	fx = json.dumps(fixationXList)
	fy = json.dumps(fixationYList)
	gd = json.dumps(gazedurationList)
	fi = json.dumps(fixationIndexList)
	
	all = {'fx': fixationXList, 'fy': fixationYList, 'gd': gazedurationList, 'fi': fixationIndexList}
	jall = json.dumps(all)
	
	#return jall
	return completeList
	
	
def prepareGazeData(data):

	datafile = open('gazedata.html', 'w')
	datafile.write(data)
	datafile.close()
	
	
def prepareImage(filename):
	
	with open(filename+".jpg", 'rb') as image_file:
		encoded_string = json.dumps(base64.b64encode(image_file.read()))
		
	# write image code into .html-file (no .json file possible due to ajaxHandler)
	imagefile = open('imagecode.html', 'w')
	imagefile.write(encoded_string)
	imagefile.close()	

	
#read filename
x = raw_input("Dateiname: ")

# save serialized data
data = extractCSVData(str(x))
prepareGazeData(data)

# prepare image for ajax request from browser
prepareImage(str(x))

# debuging output
#print data

ajaxHandler.start_server()