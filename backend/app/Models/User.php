<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Auth\Notifications\ResetPassword;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable,HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'student_id',
        'department',
        'username',
        'password',
        'role',
        'created_at',
        'updated_at',
        'fcm_token', // <--- Add this line
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

public function sendPasswordResetNotification($token)
{
  $url = "tmcsmartq://(auth)/password-reset/" . $token . "?email=" . urlencode($this->email);
  
    \Illuminate\Support\Facades\Mail::html(
        "<h3>Reset Your Password</h3>
         <p>Click the button below to open the SmartQueue app and reset your password:</p>
         <a href='{$url}' style='background: #007BFF; color: white; padding: 10px 20px; text-decoration: none; borderRadius: 5px; display: inline-block;'>Reset Password</a>
         <br><br>
         <p>If the button doesn't work, copy and paste this into your browser/notes: <br> <strong>{$url}</strong></p>",
        function ($message) {
            $message->to($this->email)
                    ->subject('Reset Your SmartQueue Password');
        }
    );
}

}
