import json,sys,urllib.request
def call(name,args):
    r=urllib.request.Request("https://mcp.provenpin.com/mcp",data=json.dumps({"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":name,"arguments":args}}).encode(),headers={"content-type":"application/json","accept":"application/json, text/event-stream","user-agent":"provenpin-benchmark"})
    return json.loads(json.loads(urllib.request.urlopen(r).read())["result"]["content"][0]["text"])
