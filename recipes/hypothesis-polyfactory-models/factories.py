from polyfactory.factories.pydantic_factory import ModelFactory

from models import Coupon, Merchant


class CouponFactory(ModelFactory[Coupon]):
    __model__ = Coupon


class MerchantFactory(ModelFactory[Merchant]):
    __model__ = Merchant
