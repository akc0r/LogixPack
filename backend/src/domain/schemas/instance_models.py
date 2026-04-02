from pydantic import BaseModel

class InstanceStats(BaseModel):
    filename: str
    vehicle_L: int
    vehicle_W: int
    vehicle_H: int
    num_items: int

class Item(BaseModel):
    id: int
    width: int
    height: int
    depth: int
    delivery_order: int

class InstanceDetails(InstanceStats):
    items: list[Item]