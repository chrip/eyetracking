#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys
import threading
import webbrowser
import BaseHTTPServer
import SimpleHTTPServer
import json
from os import curdir, sep

PORT = 8080
appendix = {}

class ComplexEncoder(json.JSONEncoder):
  def default(self, obj):
    if hasattr(obj, 'isoformat'):
      return obj.isoformat()
    return json.JSONEncoder.default(self, obj)

class AjaxHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):  
  print """The ajax handler is running..."""
  def __init__(self, request, client_address, server):
    SimpleHTTPServer.SimpleHTTPRequestHandler.__init__(self, request, client_address, server)


  #Handler for the GET requests
  def do_GET(self):
  
    if self.path=="/":
      self.path="/eyetracking_visualization.html"
	  
    try:
      #Check the file extension required and
      #set the right mime type

      sendStaticFileReply = False
      if self.path.endswith(".html"):
        mimetype='text/html'
        sendStaticFileReply = True
      elif self.path.endswith(".jpg"):
        mimetype='image/jpeg'
        sendStaticFileReply = True
      elif self.path.endswith(".gif"):
        mimetype='image/gif'
        sendStaticFileReply = True
      elif self.path.endswith(".js"):
        mimetype='application/javascript'
        sendStaticFileReply = True
      elif self.path.endswith(".json"):
        mimetype='application/json'
        sendStaticFileReply = True
      elif self.path.endswith(".css"):
        mimetype='text/css'
        sendStaticFileReply = True
      elif self.path.endswith(".png"):
        mimetype='image/png'
        sendStaticFileReply = True
      elif self.path.endswith(".csv"):
        mimetype='text/comma-separated-values'
        sendStaticFileReply = True

      if sendStaticFileReply == True:
		
        #Open the static file requested and send it
        f = open(curdir + sep + self.path, 'rb') 
        self.send_response(200)
        self.send_header('Content-type',mimetype)
        self.end_headers()
        self.wfile.write(f.read())
        f.close()
      return
    except IOError:
      self.send_error(404,'File Not Found: %s' % self.path)


def start_server():
  """Start the server."""
  server_address = ("", PORT)
  server = BaseHTTPServer.HTTPServer(server_address, AjaxHandler)
  server.serve_forever()


if __name__ == "__main__":
  start_server()
