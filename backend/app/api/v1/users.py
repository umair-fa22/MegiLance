# @AI-HINT: Backward-compatibility module alias for legacy `app.api.v1.users` imports.

import sys
from .identity import users as _users_module

sys.modules[__name__] = _users_module
