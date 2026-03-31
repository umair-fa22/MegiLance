# @AI-HINT: Backward-compatibility module alias for legacy `app.api.v1.auth` imports.

import sys
from .identity import auth as _auth_module

sys.modules[__name__] = _auth_module
