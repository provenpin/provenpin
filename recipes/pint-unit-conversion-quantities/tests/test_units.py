import pint
import pytest

from units import Q_, add_temperature, speed_mps, to_celsius, to_kelvin, unit_ratio


def test_offset_units_convert_only_via_to():
    assert to_celsius(212.0).m_as("degC") == pytest.approx(100.0, abs=1e-6)
    assert to_kelvin(100.0).m_as("kelvin") == pytest.approx(373.15)


def test_mixing_dimensions_raises():
    with pytest.raises(pint.errors.DimensionalityError):
        Q_(1, "m") + Q_(1, "s")
    with pytest.raises(pint.errors.DimensionalityError):
        Q_(1, "m").to("s")


def test_absolute_temperatures_cannot_be_added():
    with pytest.raises(pint.errors.OffsetUnitCalculusError):
        Q_(25, "degC") + Q_(25, "degC")
    assert add_temperature(25.0, 5.0).m_as("degC") == pytest.approx(30.0)


def test_compound_units_need_explicit_conversion():
    assert speed_mps(60.0, 2.0).m_as("m/s") == pytest.approx(8.3333333, rel=1e-6)
    assert speed_mps(60.0, 2.0).m_as("km/h") == pytest.approx(30.0)


def test_dimensionless_ratio_is_not_reduced_for_free():
    r = Q_(2, "m") / Q_(50, "cm")
    assert r.dimensionless is True
    assert r.magnitude == pytest.approx(0.04)
    assert unit_ratio(2.0, 50.0) == pytest.approx(4.0)


def test_formatting_specs():
    q = Q_(1234.5678, "meter")
    assert f"{q:.2f}" == "1234.57 meter"
    assert f"{q:~P}" == "1234.5678 m"
    assert f"{q:.2f~}" == "1234.57 m"
