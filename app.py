# -*- coding: utf-8 -*-
"""
단어 시험 웹 애플리케이션
Flask 기반 웹 서버
"""

from flask import Flask, render_template, jsonify, request
from data_loader import load_vocabulary_data, get_level_list, get_words_by_level

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False  # 한글 JSON 지원


@app.route('/')
def index():
    """메인 페이지"""
    return render_template('index.html')


@app.route('/api/levels')
def api_levels():
    """레벨 목록 API"""
    try:
        levels = get_level_list()
        return jsonify({'success': True, 'levels': levels})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/words/<level_id>')
def api_words(level_id):
    """특정 레벨 단어 API"""
    try:
        count = request.args.get('count', 10, type=int)
        words = get_words_by_level(level_id, count)
        return jsonify({'success': True, 'words': words})
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/check', methods=['POST'])
def api_check():
    """정답 확인 API"""
    try:
        data = request.get_json()
        word = data.get('word', '')
        user_answer = data.get('answer', '').strip()
        correct_answer = data.get('correct', '').strip()
        
        # 정답 비교 (공백 제거, 소문자 비교)
        # 뜻에서 품사 부분 제거 후 비교 (예: "n. 사진" -> "사진")
        def normalize_answer(ans):
            ans = ans.strip()
            # 품사 접두사 제거 (n., v., a., ad., prep. 등)
            prefixes = ['n.', 'v.', 'a.', 'ad.', 'adv.', 'prep.', 'conj.', 'int.', 'pron.']
            for prefix in prefixes:
                if ans.lower().startswith(prefix):
                    ans = ans[len(prefix):].strip()
                    break
            return ans
        
        normalized_user = normalize_answer(user_answer)
        normalized_correct = normalize_answer(correct_answer)
        
        # 정답에 여러 뜻이 있는 경우 (쉼표로 구분) 하나라도 맞으면 정답
        correct_meanings = [m.strip() for m in normalized_correct.split(',')]
        is_correct = normalized_user in correct_meanings or normalized_user == normalized_correct
        
        return jsonify({
            'success': True,
            'is_correct': is_correct,
            'correct_answer': correct_answer
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    print("=" * 50)
    print("단어 시험 프로그램 시작!")
    print(f"브라우저에서 http://localhost:{port} 접속")
    print("=" * 50)
    app.run(debug=False, host='0.0.0.0', port=port)
