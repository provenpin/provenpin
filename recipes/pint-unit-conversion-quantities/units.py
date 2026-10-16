import pint

ureg = pint.UnitRegistry()
Q_ = ureg.Quantity


def to_celsius(fahrenheit: float):
    return Q_(fahrenheit, "degF").to("degC")


def to_kelvin(celsius: float):
    return Q_(celsius, "degC").to("kelvin")


def add_temperature(celsius: float, delta_celsius: float):
    # absolute + delta is well defined; absolute + absolute is not (see tests)
    return (Q_(celsius, "degC") + Q_(delta_celsius, "delta_degC")).to("degC")


def speed_mps(distance_km: float, hours: float):
    return (Q_(distance_km, "km") / Q_(hours, "hour")).to("m/s")


def unit_ratio(a_meters: float, b_centimeters: float) -> float:
    # a plain dividend keeps the compound unit, so reduce it explicitly
    return (Q_(a_meters, "m") / Q_(b_centimeters, "cm")).to("").magnitude
