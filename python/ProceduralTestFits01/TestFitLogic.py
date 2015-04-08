planScale = 285/60

def hasDarkPixelsInRange(x1, y1, x2, y2):
    for x in range(x1, x2):
        for y in range(y1, y2):
            pix = pixels[y * width + x]
            if red(pix) < 60:
                return True
    return False


class OfficeInterior(object):
    officeWidth = planScale * 15
    officeDepth = planScale * 12
    
    def __init__(self):
        self.desk = Desk()
    
    def draw(self):
        rectMode(CORNERS)
        stroke(96)
        fill(224)
        
        rect(0, 0, planScale * 0.5, self.officeDepth)
        
        pushMatrix()
        translate(0, self.officeDepth / 2)
        self.desk.draw()
        popMatrix()
        


class Desk(object):
    deskWidth = planScale * 30 / 12.0
    deskLength = planScale * 60 / 12.0
    
    def __init__(self):
        pass
    
    def draw(self):
        x = screenX(0, 0)
        y = screenY(0, 0)
        if hasDarkPixelsInRange(x, y, x + self.deskLength, y + self.deskWidth):
            return
        
        rectMode(CORNERS)
        stroke(96)
        fill(224)
        rect(0, 0, self.deskLength, self.deskWidth)
        

class Layout(object):
    def __init__(self, groupType, unitType):
        self.groupType = groupType
        self.sampleGroup = groupType(unitType)
        self.unitType = unitType
    
    def draw(self, parentSize):
        loadPixels()
        
        xStep = self.sampleGroup.xSpacing + self.sampleGroup.getWidth()
        yStep = self.sampleGroup.ySpacing + self.sampleGroup.getHeight()
        
        pos = PVector(0, 0)
        for r in range(100):
            pos.x = 0
            for c in range(100):
                pushMatrix()
                translate(pos.x, pos.y)
                self.sampleGroup.draw()
                popMatrix()
                
                pos.x += xStep
                if pos.x >= parentSize.x:
                    break
            pos.y += yStep
            if pos.y >= parentSize.y:
                break


class DeskGrid(object):
    def __init__(self, unit):
        self.unit = unit
    
    def draw(self):
        pass


class DeskSlot(object):
    def __init__(self, angle):
        self.angle = angle


class DeskGroup(object):
    def __init__(self, numRows, numCols, deskType):
        self.numRows = numRows
        self.numCols = numCols
        
        self.deskType = deskType
        self.initializeGrid()
        
        self.xSpacing = 0
        self.ySpacing = 0
    
    def initializeGrid(self):
        pass
    
    def draw(self):
        pass
    
    def getWidth(self):
        pass
    
    def getHeight(self):
        pass


class HorizontalOffices(object):
    def __init__(self, officeType):
        self.officeType = officeType
        self.sampleOffice = self.officeType()
        
        self.xSpacing = 0
        self.ySpacing = 0
    
    def getWidth(self):
        return self.officeType.officeWidth

    def getHeight(self):
        return self.officeType.officeDepth

    def draw(self):
        self.sampleOffice.draw()
        

class TwoByThree(DeskGroup):
    numRows = 2
    numCols = 3
    
    def __init__(self, deskType):    
        self.deskType = deskType
        self.sampleDesk = self.deskType()
        self.initializeGrid()
        
        self.xSpacing = planScale * 4.5
        self.ySpacing = planScale * 4.5
    
    def initializeGrid(self):
        row1 = []
        row2 = []
        for c in range(self.numCols):
            row1.append(DeskSlot(0))
            row2.append(DeskSlot(PI))
        self.rowsOfDesks = [row1, row2]
    
    def getWidth(self):
        w = 0
        for c in range(self.numCols):
            w += self.deskType.deskLength
        return w

    def getHeight(self):
        h = 0
        for r in range(self.numRows):
            h += self.deskType.deskWidth
        return h
    
    def draw(self):
        
        pos = PVector(0, 0)
        for row in self.rowsOfDesks:
            for slot in row:
                pushMatrix()
                translate(pos.x, pos.y)
#                 rotate(slot.angle)
                self.sampleDesk.draw()
                popMatrix()
                
                pos.x += self.deskType.deskLength
            pos.x = 0
            pos.y += self.deskType.deskWidth
        
