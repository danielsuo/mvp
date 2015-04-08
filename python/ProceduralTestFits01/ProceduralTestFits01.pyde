
import Interface as Interface
import TestFitLogic as TestFitLogic


def makeNewDeskZone(x, y):
    newZone = Interface.Zone(TestFitLogic.Layout(TestFitLogic.TwoByThree, TestFitLogic.Desk))
    newZone.position(x-20, y-20, x, y)
    return newZone

def makeNewPerimeterOfficeZone(x, y):
    newZone = Interface.Zone(TestFitLogic.Layout(TestFitLogic.HorizontalOffices, TestFitLogic.OfficeInterior))
    newZone.position(x-20, y-20, x, y)
    return newZone



class Main(object):
    def __init__(self):
        self.zones = []
        self.plan = loadImage("floorplan_plain_0.png")
        self.zoneFactory = makeNewDeskZone
    
    def addZone(self, x, y):
        newZone = self.zoneFactory(x, y)
        self.zones.append(newZone)
    
    def draw(self):
        image(self.plan, 0, 0)
        for zone in self.zones:
            zone.draw()


def setup():
    size(1400, 900, P2D)
    global main
    main = Main()
    noLoop()

def draw(): 
    background(255)
    main.draw()

def mouseDragged():
    if Interface.ownsMouse is None:
        loop()
        main.draw()
    if Interface.ownsMouse is None:
        main.addZone(mouseX, mouseY)

def keyPressed():
    global main
    if key == '1':
        main.zoneFactory = makeNewDeskZone
    elif key == '2':
        main.zoneFactory = makeNewPerimeterOfficeZone
    else:
        pass


