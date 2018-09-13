
from cms.app_base import CMSApp
from cms.apphook_pool import apphook_pool

class CracBookingApphook(CMSApp):
    name = 'A/C Booking'
    app_name = 'booking'
    def get_urls(self, page=None, language=None, **kwargs):
        return ['crac_booking.urls']


apphook_pool.register(CracBookingApphook)

