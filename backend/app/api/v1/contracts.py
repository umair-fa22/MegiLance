# @AI-HINT: Backward-compatibility module alias for legacy `app.api.v1.contracts` imports.

import sys
from .projects_domain import contracts as _contracts_module

sys.modules[__name__] = _contracts_module
