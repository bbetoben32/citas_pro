import sendgrid
from sendgrid.helpers.mail import Mail
import os
from sendgrid import SendGridAPIClient

# Clave API de SendGrid
SENDGRID_API_KEY = 'your_sendgrid_api_key'

# Crear una instancia del cliente de SendGrid
sg = SendGridAPIClient(SENDGRID_API_KEY)

def get_email_activity():
    url = "https://api.sendgrid.com/v3/messages"
    
    # Obtener los logs de las actividades de los correos
    response = sg.client.request(method="GET", url=url)
    messages = response[1]  # Extrayendo la respuesta de mensajes
    
    # Filtrar los correos con estado 'Deferred'
    deferred_messages = [msg for msg in messages if msg['status'] == '421']
    
    return deferred_messages

def main():
    # Obtener todos los mensajes en cola
    deferred_emails = get_email_activity()
    
    if deferred_emails:
        print("Mensajes en estado Deferred (421):")
        for email in deferred_emails:
            print(f"ID: {email['message_id']} - Destinatario: {email['to_email']} - Estado: {email['status']}")
    else:
        print("No se encontraron correos en estado Deferred.")

if __name__ == "__main__":
    main()
