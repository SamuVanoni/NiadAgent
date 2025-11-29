from flask import Flask, request, jsonify, send_from_directory, abort
from docxtpl import DocxTemplate
import os
import uuid
import subprocess
from pathlib import Path

app = Flask(__name__)
BASE_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = BASE_DIR / 'templates'
GENERATED_DIR = BASE_DIR / 'generated'
GENERATED_DIR.mkdir(exist_ok=True)


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


@app.route('/generate', methods=['POST'])
def generate():
    body = request.get_json()
    if not body:
        return jsonify({'error': 'Corpo JSON inválido'}), 400

    template_name = body.get('template_name')
    data = body.get('data')
    # format: 'docx' ou 'pdf' (padrão é 'docx')
    out_format = (body.get('format') or 'docx').lower()
    if not template_name or not data:
        return jsonify({'error': 'Os campos "template_name" e "data" são obrigatórios.'}), 400

    template_path = TEMPLATES_DIR / template_name
    if not template_path.exists():
        return jsonify({'error': f'Template {template_name} não encontrado'}), 404

    try:
        # Usa DocxTemplate para renderizar Jinja2 no DOCX
        tpl = DocxTemplate(str(template_path))

        # Contexto: esperamos chaves em minúsculas (texto, data, dia, mes, ano)
        context = {k: v for k, v in data.items()}

        tpl.render(context)

        uid = uuid.uuid4().hex
        out_docx = GENERATED_DIR / f'{uid}.docx'
        out_pdf = GENERATED_DIR / f'{uid}.pdf'

        tpl.save(str(out_docx))

        # Se o formato solicitado for 'docx', retornamos o DOCX sem converter
        if out_format == 'docx':
            docx_url = request.url_root.rstrip('/') + f'/files/{out_docx.name}'
            return jsonify({'file_url': docx_url, 'file_type': 'docx'}), 200

        # Caso contrário, convertemos para PDF (padrão anterior)
        convert_cmd = [
            'soffice', '--headless', '--convert-to', 'pdf', '--outdir', str(GENERATED_DIR), str(out_docx)
        ]
        proc = subprocess.run(convert_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=120)
        if proc.returncode != 0:
            print(f"[Docx Service] Falha na conversão com LibreOffice: {proc.stderr.decode('utf-8')}")
            return jsonify({'error': 'Falha ao converter DOCX para PDF'}), 500

        if not out_pdf.exists():
            return jsonify({'error': 'PDF não foi gerado'}), 500

        pdf_url = request.url_root.rstrip('/') + f'/files/{out_pdf.name}'
        return jsonify({'file_url': pdf_url, 'file_type': 'pdf'}), 200

    except Exception as e:
        print(f"[Docx Service] ERRO ao gerar PDF: {e}")
        return jsonify({'error': f'Erro interno ao gerar PDF: {str(e)}'}), 500


@app.route('/files/<path:filename>', methods=['GET'])
def serve_file(filename):
    file_path = GENERATED_DIR / filename
    if not file_path.exists():
        abort(404)
    return send_from_directory(str(GENERATED_DIR), filename, as_attachment=True)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8090))
    app.run(host='0.0.0.0', port=port)
