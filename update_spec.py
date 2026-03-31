import yaml
import sys

def main():
    path = "E:\\MegiLance\\frontend\\doctl_app_spec.yaml"
    with open(path, 'r') as f:
        spec = yaml.safe_load(f)
    
    # We want to add missing environment variables to the backend service
    backend_service = next(s for s in spec['services'] if s['name'] == 'backend')
    
    # Let's add them
    new_keys = {
        "OPENAI_API_KEY": "",
        "RESEND_API_KEY": "re_92qAZqKU_Fq8eENUhpJbmYHX3Z3RcU9iR",
        "GOOGLE_CLIENT_ID": "334576604932-n9g48l5qrtcblunb1jkin7161bdokmpg.apps.googleusercontent.com",
        "GOOGLE_CLIENT_SECRET": "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",
        "GITHUB_CLIENT_ID": "Ov23ctGBUJFmDM3FHRCO",
        "GITHUB_CLIENT_SECRET": "f952f535dbda3c20d99d5cbf2f1167c9aad7cdd6",
        "SMTP_HOST": "smtp.gmail.com",
        "SMTP_PORT": "587",
        "FROM_EMAIL": "onboarding@resend.dev",
        "FROM_NAME": "MegiLance"
    }
    
    existing_keys = {env['key'] for env in backend_service.get('envs', [])}
    
    for k, v in new_keys.items():
        if k not in existing_keys:
            backend_service['envs'].append({
                "key": k,
                "scope": "RUN_TIME",
                "value": v
            })
            
    # Write back
    with open("E:\\MegiLance\\frontend\\doctl_app_spec_new.yaml", 'w') as f:
        yaml.dump(spec, f, sort_keys=False)

if __name__ == '__main__':
    main()
