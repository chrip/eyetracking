import csv
import json
import ajaxHandler
import os

# write required gazedata to .json file
def prepareGazeData(filename, data):
  
  #create temp ordner
  if not os.path.exists("temp"):
    os.makedirs("temp")

  #check whether the gazedata is already encoded, if yes do nothing
  if not os.path.isfile("temp/"+filename+"_gazedata.json"):
    datafile = open("temp/"+filename+'_gazedata.json', 'w')
    datafile.write(data)
    datafile.close()


# search for relevant files in "data" directory
def listFiles():

  csvfiles = []     # .csv files 
  imagefiles = []   # .jpg or .png files
  list = []         # contains files which are available as gazedata and image
  
  # get current path
  currentpath = os.path.dirname(os.path.abspath(__file__))

  # iterate over data directory, gather .csv and image files
  for file in os.listdir(currentpath + "/data"):
    if file.endswith(".csv"):
      csvfiles.append(file)
      prefix = (file.partition(".")[0]).partition("_")[0]
      if not prefix in list:
        list.append(prefix)
    if file.endswith(".jpg") or file.endswith(".png"):
      imagefiles.append(file)

  # init buckets for gazedata files
  arr = [0] * len(list)
  
  # get number of gaze data files per image
  for file in csvfiles:
    prefix = (file.partition(".")[0]).partition("_")[0]
    if prefix in list:
      i = list.index(prefix)
      arr[i]+=1
        
  # create .json file containing all possibly displayable filecombinations     
  content = "{\"selectiondata\":["

  # find pairs    
  for csvfile in csvfiles:
    for imagefile in imagefiles:
      if ((csvfile.partition(".")[0]).partition("_")[0] == imagefile.partition(".")[0]):
        f = csvfile.partition(".")[0]
        
        # create gaze data files for matching pairs
        prepareGazeData(f, extractCSVData("data/"+csvfile))
        
        urlfile = open("temp/" + f + "_url.json", 'w')
        urlfile.write(extractURLChange("data/"+csvfile))
        urlfile.close()
          
  for f in list:
          
    idx = list.index(f)
    content += "{\"name\":\"" + f + "\", \"type\":\"" + imagefiles[idx].partition(".")[2] + "\", \"count\":" + str(arr[idx]) + "},"
            
  content = content[:-1]      
  content += "]}"
  
  selectionfile = open("temp/selectiondata.json", 'w')
  selectionfile.write(content)
  selectionfile.close()
  
  #print content
  
def extractURLChange(filename):

  file = open(filename, 'rb')
  reader = csv.reader(file)
  
  list = "{\"timestamps\":["
  
  rownum = 0
  line = ""
  
  first = True
  leftClick = False
  
  for row in reader:
    if rownum == 0:
      header = row
    else:
      colnum = 0
      list += "{"
      stamp = 0
      
      for col in row:
        if (header[colnum] == 'RecordingTimestamp'):
          if first:
            starttime = int(col)
            first = False
          stamp = int(col) - starttime
        # log leftclick position  
        elif(header[colnum] == 'MouseEvent' and col == 'Left'):
          leftClick = True
        elif(header[colnum] == 'MouseEventX (MCSpx)' and col != '' and leftClick):
          line += "\"lx\":" + col + ","
        elif(header[colnum] == 'MouseEventY (MCSpx)' and col != '' and leftClick):
          line += "\"ly\":" + col + ","
          line += "\"lt\":" + str(stamp) + "},"
          leftClick = False
        #elif (header[colnum] == 'StudioEvent' and col == 'URLStart'):
          #line += "\"lt\":" + str(stamp) + ","
        #elif (header[colnum] == 'StudioEventData' and col != '' and line != ""):
          #line += "\"data\": \"" + col + "\"},"
          #print line
        
        colnum += 1
      
      list += line
      if list[len(list)-1] == "{":
        list = list[:-1] 
      line = ""
      
    rownum += 1
  # remove last comma  
  list = list[:-1]
  if list[len(list)-1] == ":":
    list += "{}}"
  else:
    list += "]}"
  
  file.close() 

  #print list
  return list
    

# get relevant content from .csv files
def extractCSVData(filename):

  # create csv file reader
  csvFile = open(filename, 'rb')
  reader = csv.reader(csvFile)
  
  # string to create json object
  completeList = "{\"gazedata\":[" 
  
  rownum = 0
  line = ""

  first = True
  # set flag if GazeEventType is unclassified
  eventFlag = False
  # use only first occurrence of index
  index = 0
  lastIndex = 0
  # set flag if fixation coordinates are not available
  fixFlag = False
  
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
        if (header[colnum] == 'MediaName' and col == ''):
          completeList = completeList[:-1]          
          break

        if (header[colnum] == 'GazeEventType' and col == 'Unclassified'):
          eventFlag = True
          completeList = completeList[:-1]
          break
          
        if (header[colnum] == "FixationPointX (MCSpx)" and col == '') or (header[colnum] == "FixationPointY (MCSpx)" and col == ''):
          fixFlag = True
          break
          
        # fixation x coordinate
        if header[colnum] == "FixationPointX (MCSpx)":
          line += "\"fx\":" + col + ","
        # fixation y coordinate  
        elif header[colnum] == "FixationPointY (MCSpx)":
          line += "\"fy\":" + col + "},"
        # gaze duration  
        elif header[colnum] == "GazeEventDuration":
          line += "\"gd\":" + col + ","
        # fixation index
        elif header[colnum] == "FixationIndex":
          line += "\"fi\":" + col + ","
          index = col
        # fixation time
        elif header[colnum] == "RecordingTimestamp":
          if first:
            starttime = int(col)
          time = int(col) - starttime + 1 
          line += "\"ft\":" + str(time) + ","
          first = False

        colnum += 1

      if eventFlag:
        line = ""
        eventFlag = False
      if index == lastIndex:
        line = "" 
      if fixFlag:
        line = ""
        fixFlag = False
      completeList += line
      if completeList[len(completeList)-1] == "{":
        completeList = completeList[:-1]
      lastIndex = index  
      line = ""
      
    rownum += 1    
    
  # remove last comma  
  completeList = completeList[:-1]
  completeList += "]}"
  
  csvFile.close() 

  return completeList


# get possible files
listFiles()  

# start ajax server
ajaxHandler.start_server()