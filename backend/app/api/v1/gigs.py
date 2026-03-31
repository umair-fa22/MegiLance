# @AI-HINT: Backward-compatibility module alias for legacy `app.api.v1.gigs` imports.

import sys
from .projects_domain import gigs as _gigs_module

sys.modules[__name__] = _gigs_module
