import csv
import json
import ajaxHandler
import base64
import os
from PIL import Image


def prepareGazeData(filename, data):
  
  #create temp ordner
  if not os.path.exists("temp"):
    os.makedirs("temp")

  #check whether the gazedata is already encoded, if yes do nothing
  if not os.path.isfile("temp/"+filename+"_gazedata.json"):
    datafile = open("temp/"+filename+'_gazedata.json', 'w')
    datafile.write(data)
    datafile.close()

# not necessary anymore since images are loaded directly via browser
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
  list = []
  
  # get current path
  currentpath = os.path.dirname(os.path.abspath(__file__))

  for file in os.listdir(currentpath + "/data"):
    if file.endswith(".csv"):
      csvfiles.append(file)
      pre = (file.partition(".")[0]).partition("_")[0]
      if not pre in list:
        list.append(pre)
    if file.endswith(".jpg") or file.endswith(".png"):
      imagefiles.append(file)

  # init buckets for daze data files
  arr = [0] * len(list)
  
  # get number of gaze data files per image
  for file in os.listdir(currentpath + "/data"):
    if file.endswith(".csv"):
      if (file.partition(".")[0]).partition("_")[0] in list:
        i = list.index((file.partition(".")[0]).partition("_")[0])
        arr[i]+=1
    
  content = "{\"selectiondata\":["

  # find pairs    
  for csvfile in csvfiles:
    for imagefile in imagefiles:
      if ((csvfile.partition(".")[0]).partition("_")[0] == imagefile.partition(".")[0]):
        f = csvfile.partition(".")[0]
        
        # on startup create html files for all possible files to prepare request from server
        #prepareImage("data/"+imagefile);
        prepareGazeData(f, extractCSVData("data/"+csvfile));
        
        if f in list:
          img = Image.open("data/"+imagefile)
          width, height = img.size
            
          idx = list.index((csvfile.partition(".")[0]).partition("_")[0])

          content += "{\"name\":\"" + f + "\", \"type\":\"" + imagefile.partition(".")[2] + "\", \"width\":" + str(width) + ", \"height\":" + str(height) + ", \"count\":" + str(arr[idx]) + "},"
          
  content = content[:-1]      
  content += "]}"
  selectionfile = open('temp/selectiondata.json', 'w')
  selectionfile.write(content)
  selectionfile.close()
  
  #print content


def extractCSVData(filename):

  csvFile = open(filename, 'rb')
  reader = csv.reader(csvFile)
  
  # string to create json object
  completeList = "{\"gazedata\":[" 
  
  rownum = 0
  line = ""
  lastline = ""
  for row in reader:
    # save header row
    if rownum == 0:
      header = row
    else:
      colnum = 0
      
      completeList += "{"  

      for col in row:
        # select relevant data and save it to separate list
        
        # skip line if not suitable to viewed file
        if header[colnum] == 'MediaName' and col == '':
          completeList = completeList[:-1]
          break
        
        # fixation x coordinate
        if header[colnum] == "FixationPointX (MCSpx)":
          #completeList += "\"fx\":" + col + ","
          line += "\"fx\":" + col + ","
        # fixation y coordinate  
        elif header[colnum] == "FixationPointY (MCSpx)":
          #completeList += "\"fy\":" + col + "},"
          line += "\"fy\":" + col + "},"
        # gaze duration  
        elif header[colnum] == "GazeEventDuration":
          #completeList += "\"gd\":" + col + ","
          line += "\"gd\":" + col + ","
        # fixation index
        elif header[colnum] == "FixationIndex":
          #completeList += "\"fi\":" + col + ","
          line += "\"fi\":" + col + ","
                    
        colnum += 1

      # force valid json
      if not line == lastline:  
        completeList += line
      elif completeList[len(completeList)-1] == "{":
        completeList = completeList[:-1]
      lastline = line
      line = ""
      
    rownum += 1    
    
  # remove last comma  
  completeList = completeList[:-1]
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
