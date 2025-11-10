document.addEventListener('DOMContentLoaded', function() {
    console.log('Checkout carregado!');
    
    const payButton = document.getElementById('payButton');
    const phoneInput = document.getElementById('phoneNumber');
    const paymentMethods = document.querySelectorAll('.payment-method');
    const loadingElement = document.getElementById('loading');
    const resultElement = document.getElementById('result');

    let selectedMethod = 'mpesa';

    // Selecionar método de pagamento
    paymentMethods.forEach(function(method) {
        method.addEventListener('click', function() {
            paymentMethods.forEach(function(m) {
                m.classList.remove('selected');
            });
            this.classList.add('selected');
            selectedMethod = this.dataset.method;
            console.log('Método selecionado:', selectedMethod);
        });
    });

    // Mostrar resultado
    function showResult(message, isSuccess) {
        resultElement.innerHTML = message;
        resultElement.className = 'result ' + (isSuccess ? 'success' : 'error');
        resultElement.style.display = 'block';
    }

    // Mostrar/ocultar loading
    function setLoading(loading) {
        loadingElement.style.display = loading ? 'block' : 'none';
        payButton.disabled = loading;
    }

    // Processar pagamento
    payButton.addEventListener('click', function() {
        const phoneNumber = phoneInput.value.trim();
        console.log('Tentando pagar com número:', phoneNumber);

        if (!phoneNumber) {
            showResult('Digite o número de telefone', false);
            return;
        }

        if (phoneNumber.length !== 9) {
            showResult('Número deve ter 9 dígitos', false);
            return;
        }

        const formattedNumber = '258' + phoneNumber;
        setLoading(true);
        resultElement.style.display = 'none';

        fetch('/api/processar-pagamento', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phoneNumber: formattedNumber,
                paymentMethod: selectedMethod
            })
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(result) {
            console.log('Resposta do servidor:', result);
            
            if (result.success) {
                showResult(result.message, true);
                
                // ⭐ REDIRECIONAMENTO APÓS SUCESSO ⭐
                setTimeout(function() {
                    if (result.redirect) {
                        window.location.href = result.redirect;
                    } else {
                        window.location.href = '/download.html';
                    }
                }, 2000); // Redireciona após 2 segundos
                
            } else {
                showResult(result.error || 'Erro no pagamento', false);
            }
        })
        .catch(function(error) {
            console.error('Erro:', error);
            showResult('Erro de conexão', false);
        })
        .finally(function() {
            setLoading(false);
        });
    });

    // Focar no input
    phoneInput.focus();
});