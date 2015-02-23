class Zone(object):
    def __init__(self, layout):
        self.layout = layout
        self.upperLeftCorner = DraggableHandle(0,0)
        self.lowerRightCorner = DraggableHandle(100,100)
    
    def position(self, x1, y1, x2, y2):
        self.upperLeftCorner.x = x1
        self.upperLeftCorner.y = y1
        self.lowerRightCorner.x = x2
        self.lowerRightCorner.y = y2
    
    def draw(self):
        pushMatrix()
        translate(self.upperLeftCorner.x, self.upperLeftCorner.y)
        availableSize = PVector(self.lowerRightCorner.x - self.upperLeftCorner.x,
                                self.lowerRightCorner.y - self.upperLeftCorner.y)
        self.layout.draw(availableSize)
        popMatrix()
        
        stroke(255,0,0)
        noFill()
        rectMode(CORNERS)
        rect(self.upperLeftCorner.x, self.upperLeftCorner.y, self.lowerRightCorner.x, self.lowerRightCorner.y)
        
        self.upperLeftCorner.draw()
        self.lowerRightCorner.draw()

def mouseIn(x1, y1, x2, y2):
    return x1 <= mouseX and mouseX < x2 and y1 <= mouseY and mouseY <= y2

ownsMouse = None

class DraggableHandle(object):
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.size = 10
        self.isDragging = False
    
    def draw(self):
        self.check()
        
        stroke(255, 0, 0)
        if self.isDragging:
            fill(255,0,0)
        elif self.isMouseOver():
            fill(255, 128, 128)
        else: 
            fill(255)
        
        pushMatrix()
        translate(self.x, self.y)
        rectMode(CENTER)
        rect(0, 0, 20, 20)
        popMatrix()
    
    def isMouseOver(self):
        return mouseIn(self.x - self.size, self.y - self.size, self.x + self.size, self.y + self.size)

    def check(self):
        global ownsMouse
        if ownsMouse is not None and ownsMouse is not self:
            return
        
        if self.isDragging and mousePressed and ownsMouse is self:
            self.x = mouseX
            self.y = mouseY
            return
        if self.isDragging and not mousePressed:
            self.isDragging = False
            if ownsMouse is self:
                ownsMouse = None
                noLoop()
            return

        if self.isMouseOver():
            if mousePressed and ownsMouse is None:
                ownsMouse = self
            self.isDragging = mousePressed


